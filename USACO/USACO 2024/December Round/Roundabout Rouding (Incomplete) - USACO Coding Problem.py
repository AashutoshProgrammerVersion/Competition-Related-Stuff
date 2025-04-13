def rounding_to_the_power_of_10(number, power_of_10):
    number_temporary = str(number)
    number_temporary2 = ""
    if int(number_temporary[-1 * (power_of_10)]) >= 5:
        number += 10**power_of_10
    number_temporary = str(number)
    number_temporary = list(number_temporary)
    print(number_temporary)
    for i in range(power_of_10):
        number_temporary[-1 * (i + 1)] = "0"
    for i in range(len(number_temporary)):
        number_temporary2 += number_temporary[i]
    number = int(number_temporary2)
    return number

def chain_rounding(number, power_of_10):
    for i in range(power_of_10):
        number = rounding_to_the_power_of_10(number, i + 1)
    return number

print(chain_rounding(48, 2))