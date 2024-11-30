s=input()
d={}
for i in range(len(s)):
    d[s[i]]=0
for i in range(len(s)):
    d[s[i]]+=1
print(d[max(d,key=d.get)]-d[min(d,key=d.get)])