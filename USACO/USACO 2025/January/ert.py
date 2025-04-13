from itertools import permutations


number_of_test_cases = int(input())

for i in range(number_of_test_cases):
    number_of_rows, left_pixels, up_pixels = [int(x) for x in input().split()]
    picture_data = []
    list_of_possible_original_photo_combinations = []
    list_of_possible_original_photo_combinations_2 = []
    star_counter = 0
    double_star_counter = 0
    for i in range(number_of_rows):
        picture_data[i] = [int(x) for x in input().split()]

    for i in range(number_of_rows):
        for j in range(number_of_rows):
            if picture_data[i][j] == 'G':
                star_counter += 1
            elif picture_data[i][j] == 'B':
                double_star_counter += 1
                star_counter += 1

    for i in range(star_counter):
        list_of_possible_original_photo_combination = [0 for x in range(number_of_rows)]
        for y in range(i):
            list_of_possible_original_photo_combination[y] = 1
        list_of_possible_original_photo_combinations.append(list_of_possible_original_photo_combination)

    for z in list_of_possible_original_photo_combinations:
        combinations = permutations(z)

        for combi in combinations:
            list_of_possible_original_photo_combinations_2.append(list(combi))

    for combi in list_of_possible_original_photo_combinations_2:
        simulated_original_photo_data = picture_data.copy()
        simulated_shifted_photo_data = picture_data.copy()
        for pixel in combi:
            if pixel == 1:
                for i in range(number_of_rows):
                    for j in range(number_of_rows):
                        if simulated_original_photo_data[i][j] = "G" or simulated_original_photo_data[i][j] == "B"
                        simulated_original_photo_data[i][j] == 1
            elif pixel == 0:
                for i in range(number_of_rows):
                    for j in range(number_of_rows):
                        simulated_shifted_photo_data[i][j] == 1