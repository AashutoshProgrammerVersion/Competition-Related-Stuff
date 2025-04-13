list_with_letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
string_length, frequency_threshold = map(int, input().split())
string = input()

possible_outcomes = []



def moo_checker(string, dictionary_with_substrings):
    for i in range(string_length - 2):
        if string[i + 1] == string[i + 2]:
            if string[i] != string[i + 1]:
                temporary_string = string[i:(i + 3)]
                if temporary_string in dictionary_with_substrings.keys():
                    dictionary_with_substrings[temporary_string] += 1
                else:
                    dictionary_with_substrings[temporary_string] = 1


# for i in range(string_length - 2):
#     if string[i + 1] == string[i + 2]:
#         if string[i] != string[i + 1]:
#             temporary_string = string[i:(i + 3)]
#             if temporary_string in dictionary_with_substrings.keys():
#                 dictionary_with_substrings[temporary_string] += 1
#             else:
#                 dictionary_with_substrings[temporary_string] = 1

# print(dictionary_with_substrings)

# for i in dictionary_with_substrings.items():
#     if i[1] >= frequency_threshold:
#         possible_outcomes.append(i[0])


possible_indexes_of_corruption = []
for i in range(string_length - 2):
    if string[i + 1] == string[i + 2]:
        possible_indexes_of_corruption.append(i)

for i in possible_indexes_of_corruption:
    for x in list_with_letters:
        dictionary_with_substrings = {}
        if x != string[i + 1]:
            temporary_string = string[:i] + x + string[(i + 1):]
            moo_checker(temporary_string, dictionary_with_substrings)
        print(dictionary_with_substrings)
        for y in dictionary_with_substrings.items():
            if y[1] >= frequency_threshold:
                possible_outcomes.append(y[0])


possible_indexes_of_corruption = []
for i in range(string_length - 2):
    if string[i] != string[i + 2]:
        possible_indexes_of_corruption.append(i)

for i in possible_indexes_of_corruption:
    for x in list_with_letters:
        dictionary_with_substrings = {}
        if x == string[i + 2]:
            temporary_string = string[:i] + x + string[(i + 1):]
            moo_checker(temporary_string, dictionary_with_substrings)
        print(dictionary_with_substrings)
        for y in dictionary_with_substrings.items():
            if y[1] >= frequency_threshold:
                possible_outcomes.append(y[0])

possible_indexes_of_corruption = []
for i in range(string_length - 2):
    if string[i] != string[i + 1]:
        possible_indexes_of_corruption.append(i)

for i in possible_indexes_of_corruption:
    for x in list_with_letters:
        dictionary_with_substrings = {}
        if x == string[i + 1]:
            temporary_string = string[:i] + x + string[(i + 1):]
            moo_checker(temporary_string, dictionary_with_substrings)
        print(dictionary_with_substrings)
        for y in dictionary_with_substrings.items():
            if y[1] >= frequency_threshold:
                possible_outcomes.append(y[0])



possible_outcomes = sorted(list(set(possible_outcomes)))
print(len(possible_outcomes))

for i in possible_outcomes:
    print(i)