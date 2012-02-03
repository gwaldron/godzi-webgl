#Import GDAL and OSR
try:
    from osgeo import gdal, osr
except ImportError:
    import gdal, osr
   
from utils import clamp, read_proj
import math
import struct

NO_DATA_VALUE = -32767.0

INTERP_NEAREST  = 0
INTERP_BILINEAR = 1
INTERP_AVERAGE  = 2


class HeightField:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.data = [NO_DATA_VALUE] * (width * height)
                
    def set_height( self, c, r, height ):
        self.data[r * self.width + c] = height
    
    def get_height( self, c, r ):
        return self.data[r * self.width + c]                    
    
    
def invertGeoTransform(gt_in):
    #we assume a 3rd row that is [1 0 0]

    #Compute determinate
    det = gt_in[1] * gt_in[5] - gt_in[2] * gt_in[4];

    if abs(det) < 0.000000000000001:
        return None

    inv_det = 1.0 / det;

    #compute adjoint, and devide by determinate
    gt_out = [0,0,0,0,0,0]
    gt_out[1] =  gt_in[5] * inv_det;
    gt_out[4] = -gt_in[4] * inv_det;

    gt_out[2] = -gt_in[2] * inv_det;
    gt_out[5] =  gt_in[1] * inv_det;

    gt_out[0] = ( gt_in[2] * gt_in[3] - gt_in[0] * gt_in[5]) * inv_det;
    gt_out[3] = (-gt_in[1] * gt_in[3] + gt_in[0] * gt_in[4]) * inv_det;

    return gt_out


def applyGeoTransform(geotransform, x, y):
    out_x = geotransform[0] + geotransform[1] * x + geotransform[2] * y
    out_y = geotransform[3] + geotransform[4] * x + geotransform[5] * y
    return out_x, out_y

def isValidValue(v, band):
    bandNoData = band.GetNoDataValue()
    if bandNoData == None:
        bandNoData = NO_DATA_VALUE
    #Check to see if the value is equal to the bands specified no data
    if bandNoData == v: return False
    
    #Check within a sensible range
    if v < -32000: return False;
    if v > 32000 : return False;
    return True

def getElevation(band, x, y):
    scanline = band.ReadRaster(int(x),int(y), 1,1, 1, 1, gdal.GDT_Float32)
    scanline = struct.unpack('f' * 1, scanline)
    return float(scanline[0])
    

def getInterpolatedValue(band, invTransform, x, y, interp):
    
    c, r = applyGeoTransform(invTransform, x, y)
    
    #TODO:  Apply rounding code?

    #Apply half pixel offset
    r-= 0.5;
    c-= 0.5;

    #Account for the half pixel offset in the geotransform.  If the pixel value is -0.5 we are still technically in the dataset
    #since 0,0 is now the center of the pixel.  So, if are within a half pixel above or a half pixel below the dataset just use
    #the edge values
    if c < 0 and c >= -0.5:
        c = 0.0
    elif c > band.XSize-1 and c <= band.XSize-0.5:
        c = band.XSize-1.0

    if r < 0 and r >= -0.5:
        r = 0.0;
    elif r > band.YSize-1 and r <= band.YSize-0.5:
        r = band.YSize-1;

    result = 0.0

    #If the location is outside of the pixel values of the dataset, just return 0
    if c < 0 or r < 0 or c > band.XSize-1 or r > band.YSize-1:
        return NO_DATA_VALUE;
    
    if interp == INTERP_NEAREST:
        result = getElevation(band, round(c), round(r))
        if not isValidValue(result, band):
            result = NO_DATA_VALUE
    else:        
        rowMin = int(clamp(math.floor(r), 0, band.YSize-1))
        rowMax = int(clamp(math.ceil(r) , 0, band.YSize-1))
        colMin = int(clamp(math.floor(c), 0, band.XSize-1))
        colMax = int(clamp(math.ceil(c) , 0, band.XSize-1))
            
        if rowMin > rowMax: rowMin = rowMax;
        if colMin > colMax: colMin = colMax;
        
        llHeight = getElevation(band, colMin, rowMin)
        ulHeight = getElevation(band, colMin, rowMax)
        lrHeight = getElevation(band, colMax, rowMin)
        urHeight = getElevation(band, colMax, rowMax)
        
        if not isValidValue(urHeight, band) or not isValidValue(llHeight, band) or not isValidValue(ulHeight, band) or not isValidValue(lrHeight, band):
            return NO_DATA_VALUE;
        
        
        if interp == INTERP_BILINEAR:
            if ((colMax == colMin) and (rowMax == rowMin)):
                #Exact match
                result = llHeight
            elif colMax == colMin:
                #Linear interpolate vertically
                result = (float(rowMax) - r) * llHeight + (r - float(rowMin)) * ulHeight
            elif rowMax == rowMin:
                #Linear interpolate horizontally
                result = (float(colMax) - c) * llHeight + (c - float(colMin)) * lrHeight
            else:
                #Bilinear interpolate
                r1 = (float(colMax) - c) * llHeight + (c - float(colMin)) * lrHeight
                r2 = (float(colMax) - c) * ulHeight + (c - float(colMin)) * urHeight
                result = (float(rowMax) - r) * r1 + (r - float(rowMin)) * r2             
        elif interp == INTERP_AVERAGE:
            x_rem = c - int(c)
            y_rem = r - int(r)                
                    
            w00 = (1.0 - y_rem) * (1.0 - x_rem) * llHeight;
            w01 = (1.0 - y_rem) * x_rem * lrHeight;
            w10 = y_rem * (1.0 - x_rem) * ulHeight;
            w11 = y_rem * x_rem * urHeight;
                    
            result = (w00 + w01 + w10 + w11);
            
    
    return result;
    
    
class ElevationDataset:
    def __init__(self, filename, mapsrs):
        self.filename = filename
        self.mapsrs = mapsrs
        self.dataset = None
        
        try:
            self.dataset = gdal.Open(str(filename))            
        except:
            pass
            
        if not self.dataset:
            print "Failed to open %s" % (filename,)
            return
        
        if self.dataset:
            self.band = self.dataset.GetRasterBand(1)
            self.geotransform = self.dataset.GetGeoTransform()
            self.invgeotransform = invertGeoTransform(self.geotransform)
            
        #Get the file SRS
        projection = self.dataset.GetProjection()
        if projection is None or len(projection) == 0:
            projection = read_proj( self.filename )            
            
        if projection is not None and len(projection) > 0:
            self.srs = osr.SpatialReference()
            self.srs.ImportFromWkt(projection)
        
        self.transformer = None
        if not self.srs.IsSame( mapsrs ):
            self.transformer = osr.CoordinateTransformation(self.mapsrs, self.srs)        
    
    @property
    def valid(self):
        return self.dataset and self.band and self.srs
            
    def getInterpolatedValue(self, x, y, interp):
        local_x = x
        local_y = y
        
        #Transform the points if necessary
        if self.transformer:
            local_x, local_y, z = self.transformer.TransformPoint(x, y, 0)        
        
        return getInterpolatedValue(self.band, self.invgeotransform, local_x, local_y, interp)
        
        
class ElevationLayer:
    def __init__(self):
        self.datasets = []
        self.srs = osr.SpatialReference()
        self.srs.ImportFromEPSG(4326)
        
    def add_dataset( self, filename ):
        """
        Appends an elevation dataset
        """
        ds = ElevationDataset( filename, self.srs )
        if ds.valid:
            self.datasets.append( ds )
        else:
            print "Failed to add %s" % filename        
        
    def create_heightfield( self, tile, tilesize, interp = 2):
        #Initialize the heightfield
        result = HeightField( tilesize, tilesize )
        
        bounds = tile.bounds
        
        xmin = bounds[0]
        ymin = bounds[1]
        xmax = bounds[2]
        ymax = bounds[3]                                      
                    
        dx = (xmax - xmin) / (tilesize-1);
        dy = (ymax - ymin) / (tilesize-1);
    
        for r in range(0,tilesize):            
            geoY = ymin + (dy * float(r))

            for c in range(0,tilesize):
                geoX = xmin + (dx * float(c))                
                   
                height = 0                
                
                for ds in self.datasets:
                    h = ds.getInterpolatedValue(geoX, geoY, interp)
                    if h != NO_DATA_VALUE:
                        height = h
                        break     
                                        
                result.set_height(c, r, height )                                                                                           
        return result            

