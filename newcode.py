import os
from datetime import datetime
import xml.etree.ElementTree as ET

# Path to your folder
folder_path = "/Users/kcorless/UpNDown/src/"
output_file = "updated_files.xml"

# Function to check if a file was updated today
def is_updated_today(filepath):
    modified_time = os.path.getmtime(filepath)
    modified_date = datetime.fromtimestamp(modified_time).date()
    return modified_date == datetime.today().date()

# Initialize XML structure
root = ET.Element("documents")
index = 1

# Function to read file content with fallback encoding
def read_file_with_fallback(file_path):
    encodings = ["utf-8", "us-ascii", "latin-1", "windows-1252"]
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as file:
                return file.read()
        except UnicodeDecodeError:
            continue
    return None  # If all encodings fail

# Traverse the folder
for filename in os.listdir(folder_path):
    file_path = os.path.join(folder_path, filename)
    
    # Skip directories
    if os.path.isfile(file_path) and is_updated_today(file_path):
        content = read_file_with_fallback(file_path)
        if content is None:
            print(f"Warning: Could not read {filename} due to encoding issues.")
            continue
        
        # Add document to XML
        document = ET.SubElement(root, "document", {"index": str(index)})
        source = ET.SubElement(document, "source")
        source.text = filename
        doc_content = ET.SubElement(document, "document_content")
        doc_content.text = content
        
        index += 1
        
# Write the XML to a file
tree = ET.ElementTree(root)
with open(output_file, "wb") as f:
    tree.write(f, encoding="utf-8", xml_declaration=True)
    
print(f"Updated files have been saved to {output_file}")
