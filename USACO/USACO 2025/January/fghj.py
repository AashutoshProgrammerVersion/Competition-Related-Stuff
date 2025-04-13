number_of_integers = int(input())
list_of_integers = [int(x) for x in input().split()]

possible_distinct_moos = {}
number_of_possible_distinct_moos = 0
consecutive_integers_index_list = []

count = 0

for i in range(1, number_of_integers - 1):
    if list_of_integers[i] == list_of_integers[i + 1]:
        string_of_consecutive_integers = str(list_of_integers[i]) + str(list_of_integers[i + 1])
        consecutive_integers_index = i + 2
        consecutive_integers_index_list.append(consecutive_integers_index)
        possible_distinct_moos[string_of_consecutive_integers] = set()

for y, number in possible_distinct_moos.keys(), len(consecutive_integers_index_list):
    if count == 0:
        new_list_of_integers = set([x for x in list_of_integers[:y] if x != list_of_integers[y - 2]])
        possible_distinct_moos[y] = new_list_of_integers
        count += 1
    else:
        new_list_of_integers = set([x for x in list_of_integers[:y] if x != list_of_integers[y - 2]])
        possible_distinct_moos[y] = new_list_of_integers


if string_of_consecutive_integers in possible_distinct_moos.keys():
    for i in new_list_of_integers:
        possible_distinct_moos[string_of_consecutive_integers].add(i)
else:
    possible_distinct_moos[string_of_consecutive_integers] = new_list_of_integers


for i in possible_distinct_moos.values():
    number_of_possible_distinct_moos += len(i)

print(number_of_possible_distinct_moos)