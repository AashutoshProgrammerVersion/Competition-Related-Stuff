number = 2024**2
possible_numbers_for_b = []

for i in range(1, number + 1):
    if number % i == 0:
        second_number_of_pair = int(number // i)
        b = (second_number_of_pair - i) / 2
        c = (second_number_of_pair + i) / 2
        if c.is_integer() and b.is_integer() and b > 0 and c > 0:
            possible_numbers_for_b.append(int(b))

print(min(possible_numbers_for_b) * len(possible_numbers_for_b))