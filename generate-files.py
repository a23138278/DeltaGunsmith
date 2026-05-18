import os  
  
dirs = ['app', 'app/guns/[id]', 'app/submit', 'components', 'data']  
for d in dirs:  
    os.makedirs(d, exist_ok=True)  
print('Directories created') 
