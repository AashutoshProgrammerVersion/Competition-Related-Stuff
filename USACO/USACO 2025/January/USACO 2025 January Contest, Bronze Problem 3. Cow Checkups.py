number_of_cows = int(input())
cow_numbers = [int(x) for x in input().split()]
doctor_want_cow_numbers = [int(x) for x in input().split()]


number_of_operations_causing_cow_check = [0 for i in range(number_of_cows + 1)]

for i in range(number_of_cows):
    for j in range(number_of_cows - i):
        if i == j + i:
            number_of_cows_operated = 0
            simulated_cow_numbers = cow_numbers.copy()
            for x in range(number_of_cows):
                if simulated_cow_numbers[x] == doctor_want_cow_numbers[x]:
                    number_of_cows_operated += 1
            number_of_operations_causing_cow_check[number_of_cows_operated] += 1
        else:
            number_of_cows_operated = 0
            simulated_cow_numbers = cow_numbers.copy()
            simulated_cow_numbers_to_reverse = simulated_cow_numbers[i:(i + j + 1)]

            simulated_cow_numbers_to_reverse = simulated_cow_numbers_to_reverse[::-1]

            simulated_cow_numbers[i:(i + j + 1)] = simulated_cow_numbers_to_reverse
            for x in range(number_of_cows):
                if simulated_cow_numbers[x] == doctor_want_cow_numbers[x]:
                    number_of_cows_operated += 1
            number_of_operations_causing_cow_check[number_of_cows_operated] += 1

for i in number_of_operations_causing_cow_check:
    print(i)