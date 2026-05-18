import os  
import json  
  
# Create directories  
dirs = ['app', 'app/guns/[id]', 'app/submit', 'components', 'data']  
for d in dirs:  
    os.makedirs(d, exist_ok=True)  
    print(f'Created directory: {d}')  
  
print('Directories created!') 
