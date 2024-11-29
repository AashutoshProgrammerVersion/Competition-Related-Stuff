def is_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

def digit_sum(n):
    return sum(int(digit) for digit in str(n))

def generate_prime_digit_sums():
    prime_digit_sums = []
    for num in range(100, 1000):
        if is_prime(digit_sum(num)):
            prime_digit_sums.append(num)
    return prime_digit_sums

prime_digit_sums = generate_prime_digit_sums()

result = []
for num in prime_digit_sums:
    for i in range(1, 32):  # 32^2 = 1024, which is more than 999
        square = i * i
        diff = num - square
        if 10 <= diff < 100 and str(diff)[-1] == str(num)[-1]:
            result.append([num, diff])

print(result)

final_result = []
for item in result:
    num, diff = item
    third_num = diff - digit_sum(diff)
    if str(third_num)[-1] == str(num)[1]:
        final_result.append([num, diff, third_num])

print(final_result)