import os

def clamp(value, min_val, max_val):
    if value < min_val:
        return min_val
    if value > max_val:
        return max_val
    return value
   
def clamp_above(value, minimum):
    if value < minimum:
        return minimum
    else:
        return value
       
def clamp_below(value, maximum):
    if value > maximim:
        return maximim
    else:
        return value
        
        
def makedirs(path, hide_dir_exists=True):
    
    if hasattr(os, "umask"):
        old_umask = os.umask(int("000", 0))
    try:
        os.makedirs(path)
    except OSError, E:
        # os.makedirs can suffer a race condition because it doesn't check
        # that the directory  doesn't exist at each step, nor does it
        # catch errors. This lets 'directory exists' errors pass through,
        # since they mean that as far as we're concerned, os.makedirs
        # has 'worked'
        if E.errno != 17 or not hide_dir_exists:
            raise E
    if hasattr(os, "umask"):
        os.umask(old_umask)
        
def read_proj(self, file):
    import os
    basename, ext = os.path.splitext(file)
    prjfile = basename + ".prj"
    if os.path.exists(prjfile):
       f = open(prjfile)
       projection = f.read()
       f.close()
       return projection
    return None


class Tile:
    def __init__(self, x, y, z, bounds=(-180.0,-90.0,180.0,90.0)):
        self.x = x
        self.y = y
        self.z = z
        self.bounds = bounds
    
    @property
    def size(self):
        return (self.bounds[2] - self.bounds[0], self.bounds[3] - self.bounds[1])
        
    def create_subtile(self, quadrant):
        """
        Creates a subkey of this FeatureTile
        """      
        z = self.z + 1
        x = self.x * 2
        y = self.y * 2
        
        size = self.size
        width = size[0]  / 2
        height = size[1] / 2

        xmin = self.bounds[0]
        ymin = self.bounds[1]
        
        if quadrant == 1:
            x += 1
            xmin += width
        elif quadrant == 2:
            y += 1
            ymin += height
        elif quadrant == 3:
            x += 1
            y += 1
            xmin += width
            ymin += height
            
        return Tile(x, y, z, (xmin, ymin, xmin+width, ymin+height))                          
        
    def intersects(self, bounds):
        b = self.bounds
        return max(b[0],bounds[0]) <= min(b[2],bounds[2]) and max(b[1],bounds[1]) <= min(b[3],bounds[3])
                
        
    def __str__(self):
        return "%s (%s,%s)" % (self.z, self.x, self.y)                         
    
