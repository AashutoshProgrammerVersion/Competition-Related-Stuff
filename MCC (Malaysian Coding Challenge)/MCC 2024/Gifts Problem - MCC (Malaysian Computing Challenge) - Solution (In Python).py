"""
You are hosting a party with n guests but have prepared only m gifts, where m < n. To decide who should receive a gift, you assign each guest a tier number ti (1 ≤ ti ≤ 10^9). The lower the tier number, the closer the guest is to you. Guests with a tier number of 1 are your closest friends. You will distribute the gifts based on the tier numbers: First, give gifts to all guests in tier 1. Then, proceed to tier 2, tier 3, and so on. If there are not enough gifts for all guests in a tier, prioritize guests based on their arrival order. For simplicity, guests arrive in the order of their indices; that is, guest i arrives before guest j if i < j. Determine which guests will receive a gift.
The first line contains two integers n and m (1 ≤ m < n ≤ 10^5) — the number of guests and the number of gifts.
The second line contains n integers t1,t2,…,tn (1 ≤ ti ≤ 10^9) — the tier numbers of the guests.
Output a single line containing n integers x1,x2,…,xn, where xi=1 if guest i receives a gift, and xi=0 otherwise
"""


fileread = open('input.txt','r')
filewrite = open('output.txt','w')

lines_of_all_numbers = [i.strip() for i in fileread.readlines()]

number_of_guests, number_of_gifts = [int(x) for x in lines_of_all_numbers[0].split()]
lines_of_all_numbers.pop(0)

guests = [int(x) for x in lines_of_all_numbers[0].split()]

tier_numbers = sorted((set(guests)))
guests_sorted = [[] for i in range(len(tier_numbers))]
gifted_guests = []

for i in range(len(guests)):
    guests_sorted[tier_numbers.index(guests[i])].append(i)

for i in range(len(guests_sorted)):
    for j in guests_sorted[i]:
        if number_of_gifts > 0:
            gifted_guests.append(j)
            number_of_gifts -= 1
        else:
            break
    if number_of_gifts == 0:
        break

got_gift_or_not = [str(1) if x in gifted_guests else str(0) for x in range(len(guests))]
filewrite.write(' '.join(got_gift_or_not))
print(' '.join(got_gift_or_not))


fileread.close()
filewrite.close()