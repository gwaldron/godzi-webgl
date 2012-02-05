import sys
import datetime
import os

import simplejson as json

from utils import Tile, makedirs

from ElevationLayer import *

try:
    from optparse import OptionParser
except ImportError:
    OptionParser = False 

try:
    from osgeo import gdal, osr
except ImportError:
    import gdal, osr
    
def get_filename( tile, dest, format):    
    return os.path.join(dest, "%s/%s/%s.%s" % (tile.z, tile.x, tile.y, format))
    
def write_json( hf, filename):
    #Make the directory path if it doesn't exist
    dirname  = os.path.dirname(filename)
    if not os.path.exists(dirname):
       makedirs(dirname)


    heightfield = {
      "width": hf.width,
      "height": hf.height,
      "data": hf.data
    }                    
        
    f = open(filename, 'w')
    f.write( json.dumps(heightfield)  )
    f.close()    
    
    
def write_tiff( hf, filename):
    #Make the directory path if it doesn't exist
    dirname  = os.path.dirname(filename)
    if not os.path.exists(dirname):
       makedirs(dirname)
       
    import struct
    #Get the GTiff driver
    driver = gdal.GetDriverByName("GTiff")

    #Create the dataset
    ds = driver.Create(filename, hf.width, hf.height, 1, gdal.GDT_Float32)
            
    band = ds.GetRasterBand( 1 )
    
    for r in range(0, hf.height):
        scanline = []
        for c in range(0, hf.width):
            height = hf.get_height(c,r)
            scanline.append( height )
        packed_data = struct.pack('f'*len(scanline), *scanline)
        line = hf.height-r-1
        band.WriteRaster(0, line, band.XSize, 1, packed_data, buf_type=gdal.GDT_Float32)
    ds.FlushCache()
    ds = None
    
def process_tile( tile, layer, options ):
    print "Processing %s " % tile

    if tile.z >= options.levels[0]:
        hf = layer.create_heightfield( tile, options.tilesize )                       
        filename = get_filename( tile, options.destination, options.format)
        if options.format == "tif":
          write_tiff(hf, filename)
        elif options.format == "json":
          write_json(hf, filename)
          pass
    if tile.z + 1 <= options.levels[1] and tile.intersects( options.bounds ):
        for i in range(0, 4):
            child = tile.create_subtile( i )
            process_tile( child, layer, options )                    
                     
def main():
    if not OptionParser:
        raise Exception("tile.py requires optparse/OptionParser.")
        
    parser = OptionParser()

    parser.add_option("-b", "--bounds", dest="bounds", type="float", nargs=4, default=(-180,-90,180,90))
    
    parser.add_option("--tilesize", dest="tilesize", type="int", default=32)
    
    parser.add_option("--format", dest="format", default="json")
    parser.add_option("--destination", dest="destination", default="out")      
    
    parser.add_option("--levels", dest="levels", type="int", nargs=2, default=(0,5),
                      help="The levels to seed")
                     

    args = sys.argv[1:]
    if len(args) == 0:
        parser.print_help()
        return 0
    
    (options, args) = parser.parse_args()
    
    print "Bounds: %s, %s, %s, %s" % options.bounds
    print "Levels: %s to %s" % options.levels   
    print "Tile Size: %s" % options.tilesize
    print "Format: %s" % options.format
    print "Destination: %s" % options.destination
    
    layer = ElevationLayer()
    for f in args:
        print "Adding dataset %s" % f
        layer.add_dataset( f )

    #Create the two root keys
    tile0 = Tile(z=0, x=0, y=0, bounds=(-180.0, -90.0, 0.0, 90.0))
    tile1 = Tile(z=0, x=1, y=0, bounds=(0.0,-90.0, 180.0, 90.0))
          
    starttime = datetime.datetime.now()                                      
    
    process_tile( tile0, layer, options )
    process_tile( tile1, layer, options )
                   
    endtime = datetime.datetime.now()                    
    
    print "Finished in %s " % (endtime-starttime,)
    
    return 0



if __name__ == '__main__':    
    main() 
