"""
You are given three integers N, M, and K. You have K arrows, and your goal is to destroy N targets. Each target i has an initial hit points (hp) value of ai. To destroy a target, its hp must be less than or equal to 0. When you shoot an arrow with power X at target i, it decreases the hp of all targets with index j≥i by an amount calculated as follows:
Damage to target j=max(0,(M⋅X)-(j-i)^2)
Your task is to find the minimum possible value of X such that you can destroy all targets, given that you can choose the indices of your arrows optimally.
The first line contains three integers N, M, and K: the number of targets, the multiplier for the arrow power, and the number of arrows, respectively. The second line contains N integers a0,a1,…,aN−1 representing the initial hp of the targets. Output a single integer, the minimum value of X such that you can destroy all targets.
Denote A=a0+a1+…+aN−1. In all test cases we have (1 ≤ M ≤ 10^9), (1 ≤ N ≤ 2×10^5), (1 ≤ K ≤ 10^9), and (1 ≤ ai ≤ 10^9).
"""


fileread = open('input.txt','r')
filewrite = open('output.txt','w')

lines_of_all_numbers = [i.strip() for i in fileread.readlines()]


number_of_targets, damage_multiplier, number_of_arrows = map(int, lines_of_all_numbers.pop(0).split())
targets_hp = list(map(int, lines_of_all_numbers[0].split()))
array_of_powers = [0, max(targets_hp) // damage_multiplier]


while array_of_powers[0] <= array_of_powers[1]:
    temporary_power = sum(array_of_powers) // 2
    targets_hp_temporary = targets_hp.copy()
    number_of_arrows_temporary = number_of_arrows
    damage_multiplier_times_temporary_power = damage_multiplier * temporary_power
    index_with_zero = 0

    while number_of_arrows_temporary > 0:
        for i in range(len(targets_hp_temporary)):
            if targets_hp_temporary[i] > 0:
                index_with_zero = i
                break
        for i in range(index_with_zero, len(targets_hp_temporary)):
            damage = max(0, damage_multiplier_times_temporary_power - ((i - (index_with_zero)) ** 2))
            if damage == 0:
                break
            targets_hp_temporary[i] -= damage
        number_of_arrows_temporary -= 1

    for x in targets_hp_temporary:
        if x > 0:
            array_of_powers[0] = temporary_power + 1
            break
    else:
        array_of_powers[1] = temporary_power - 1

print(array_of_powers[0])

fileread.close()
filewrite.close()