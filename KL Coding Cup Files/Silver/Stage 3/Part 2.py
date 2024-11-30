s=0
for i in range(int(input()),int(input())+1):
    if i%sum([int(x) for x in str(i)])==0:
        s+=i
print(s)