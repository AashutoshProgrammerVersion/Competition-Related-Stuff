possible_product_of_all_values_of_n = 1

for i in range(2, 2025):
    x = (2024 - (i*(i+1))/2)/(i+1)
    if x.is_integer() and x > 0:
        possible_product_of_all_values_of_n = possible_product_of_all_values_of_n * (i + 1)

print(possible_product_of_all_values_of_n)
