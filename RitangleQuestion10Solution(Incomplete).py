import re
from num2words import num2words


def count_vowels(input_string):
    vowels = "aeiouAEIOU"
    count = 0
    for char in input_string:
        if char in vowels:
            count += 1
    return count

def count_words(input_string):
    words = re.split(r'[ \-,]+', input_string)
    return len(words)


string1 = "Count carefully and you will see that this sentence contains "
string1_word_length = count_words(string1)
string1_vowel_length = count_vowels(string1)
string2 = " words and between them they contain "
string2_word_length = count_words(string2)
string2_vowel_length = count_vowels(string2)
string3 = " vowels"
string3_word_length = count_words(string3)
string3_vowel_length = count_vowels(string3)

additional_string_word_length = string1_word_length + string2_word_length + string3_word_length
additional_string_vowel_length = string1_vowel_length + string2_vowel_length + string3_vowel_length

print(num2words(2222))

