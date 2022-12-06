import bpy
from bpy import context
import sys
import numpy

obj = context.active_object

coords = [(obj.matrix_world @ v.co) for v in obj.data.vertices]

f = open("test.txt", mode="w")
sys.stdout = f

print(len(coords))

colors = obj.data.attributes['col'].data.foreach_set('color', coords)

print("Length of colors:" + str(len(colors)))