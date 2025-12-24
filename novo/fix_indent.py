import re

file_path = r'd:\musicasua-main\musicasua-main\backend\routes\album_upload.py'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

fixed_lines = []
for line_num, line in enumerate(lines, 1):
    # Remove carriage returns
    line = line.rstrip('\r\n')
    
    # If line has leading spaces that are not multiple of 4, fix it
    if line and line[0] == ' ':
        stripped = line.lstrip()
        spaces = len(line) - len(stripped)
        
        # Round to nearest multiple of 4
        intended_spaces = (spaces // 4) * 4
        line = ' ' * intended_spaces + stripped
    
    fixed_lines.append(line + '\n')

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print(f'Fixed {len(fixed_lines)} lines')
