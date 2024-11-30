s=input()
a=input()
c=0
for i in range(len(s)):
    if s[i]==a[i]:
        c+=5
    else:
        c-=1
print(int(c/(5*len(s))*100))