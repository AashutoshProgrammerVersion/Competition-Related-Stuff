import sys

list_of_letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
list_of_letters_count = [0 for i in range(26)]

input_file = open("blocks.in", 'r')
output_file = open("blocks.out", 'w')

number_of_boards = int(input_file.readline())

for i in range(number_of_boards):
    word_1, word_2 = input_file.readline().split()
    word_1 = list(word_1)
    word_2 = list(word_2)
    print(word_1, word_2)

    for i in range(26):
        list_of_letters_count[i] += max(word_1.count(list_of_letters[i]), word_2.count(list_of_letters[i]))

    print(list_of_letters_count)

for i in range(26):
    output_file.write(str(list_of_letters_count[i]) + '\n')