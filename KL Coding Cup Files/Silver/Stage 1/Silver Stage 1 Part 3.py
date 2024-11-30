import re
from itertools import chain

f = open("Dracula.txt", "r")
input_string = [i.strip() for i in f.readlines()]

print(input_string)

input_string = [x.split() for x in input_string]

print(input_string)

input_string = list(chain.from_iterable(input_string))
print(input_string)

index = 0
for x in input_string:
    clean_string = re.sub(r'[^\w\s]', '', x)
    input_string[index] = clean_string
    index += 1

print(input_string)

words = ["dark", "ghost", "spooky"]
word_count = 0

for x in input_string:
    if x in words:
        word_count += 1

print(word_count)
print(word_count * 2)