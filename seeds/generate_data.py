import csv
import random

properties = []
property_id = 1

bedrooms_options = [1, 2, 3, 4, 5]
bathrooms_options = [1, 1.5, 2, 2.5, 3, 3.5, 4]

for i in range(2000):
    property_data = {
        'id': property_id,
        'price': round(random.uniform(100000, 2000000), 2),
        'bedrooms': random.choice(bedrooms_options),
        'bathrooms': random.choice(bathrooms_options),
    }
    properties.append(property_data)
    property_id += 1

with open('seeds/properties_dataset.csv', 'w', newline='') as csvfile:
    fieldnames = ['id', 'price', 'bedrooms', 'bathrooms']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for prop in properties:
        writer.writerow(prop)

print(f"Generated {len(properties)} properties")