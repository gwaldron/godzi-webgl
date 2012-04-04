import sys
import os
import random

import simplejson as json

try:
    from optparse import OptionParser
except ImportError:
    OptionParser = False 

try:
    from osgeo import gdal, ogr, osr
except ImportError:
    import gdal, osr, ogr

def is_clockwise( geometry ):
    area = 0
    for i in range(geometry.GetPointCount()-1):
        start = geometry.GetPoint(i)
        end   = geometry.GetPoint(i+1)
        area += (start[0] * -end[1]) - (end[0] * -start[1])
    return area < 0

def print_geometry(geometry, height):   
    geom_count = geometry.GetGeometryCount()
    if geom_count > 0:
      for i in range(geom_count):
          print_geometry( geometry.GetGeometryRef( i ), height )
          if i < geom_count-1: print ','
    else:
	  print '{'
	  print '"altura": %s,' % height
	  print '"hoja": %s,' % 0    	
          print '"vertices": ['
	  pts = []
          #Don't print out the last point since it's generally the same as the first and the tesselator
          #will choke with duplicate point          
	  for j in range(geometry.GetPointCount()):
              add = True
	      p = geometry.GetPoint( j )
              if j == geometry.GetPointCount()-1:
                 if geometry.GetPoint( 0 ) == p:
                     add = False                                          

	      if add: pts.append('{"lon": %s, "lat": %s}' % (p[0], p[1]))
          if is_clockwise( geometry ): pts.reverse()

	  print ','.join(pts)
	  print ']'
          print '}'

def print_feature(feature,  options):
    height = random.randrange( 5, 50)
    print_geometry( feature.GetGeometryRef(), height )             
   
def main():
    if not OptionParser:
        raise Exception("build_buildings.py requires optparse/OptionParser.")
        
    parser = OptionParser()
    parser.add_option("-b", "--bounds", dest="bounds", type="float", nargs=4, default=(-180.0,-90.0,180.0,90.0))       
    #parser.add_option("--random-height", action="store_true", default=False)
    #parser.add_option("--height-attrib", dest="height_attrib", type="string", default=None)
    #parser.add_option("--height", dest="height", type="float", default=None)
                      
    args = sys.argv[1:]
    if len(args) == 0:
        parser.print_help()
        return 0
    
    (options, args) = parser.parse_args()
    
    source = args[0]

    #Open up the source with OGR
    ds = ogr.Open( source )
    if ds is None:
       print "Failed to open %s" % source
       return 1

    layer = ds.GetLayer()
    if layer is None:
        print "Failed to get layer"

    latlon_srs = osr.SpatialReference()
    latlon_srs.ImportFromProj4("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs")

    bounds = [options.bounds[0], options.bounds[1], options.bounds[2], options.bounds[3]]
    
    #print bounds
    #spatialFilter.AssignSpatialReference( latlon_srs )
    srs = osr.SpatialReference()
    wkt = layer.GetSpatialRef()
    srs.ImportFromWkt( str(wkt) )


    transformer = osr.CoordinateTransformation( latlon_srs, srs)
    bounds[0], bounds[1], tmp = transformer.TransformPoint( bounds[0], bounds[1], 0 )
    bounds[2], bounds[3], tmp = transformer.TransformPoint( bounds[2], bounds[3], 0 )
    #ll = transformer.TransformPoint( bounds[0], bounds[1], 0 )
    #ur = transformer.TransformPoint( bounds[2], bounds[3], 0 )
    #bounds[0] = ll[0]
    #bounds[1] = ll[1]
    #bounds[2] = ur[0]
    #bounds[3] = ur[1]

    spatialFilter = ogr.CreateGeometryFromWkt('POLYGON((%s %s, %s %s, %s %s, %s %s, %s %s)))' %
                                               (                
                                               bounds[0], bounds[1], #ll
                                               bounds[0], bounds[3], #ul
                                               bounds[2], bounds[3], #ur
                                               bounds[2], bounds[1], #lr
                                               bounds[0], bounds[1]  #ll
                                               ))


    

    #spatialFilter.TransformTo( srs )
    layer.SetSpatialFilter( spatialFilter )
    #print spatialFilter.ExportToWkt()

        
    #max_features = 1000
    print '['
    f = layer.GetNextFeature()
    i = 0
    while f:
        f.GetGeometryRef().TransformTo(latlon_srs)
        print_feature( f, options )
        f = None
        i = i+1
        #if i < max_features:
        #    f = layer.GetNextFeature()
        f = layer.GetNextFeature() 
        if f is not None:
            print ','
    print ']'    
       
    return 0



if __name__ == '__main__':    
    main() 
