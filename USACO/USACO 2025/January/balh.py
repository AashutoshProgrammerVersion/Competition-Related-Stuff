import sys

# sys.stdin/stdout is similar to a file in that we read lines for input/output
my_str = sys.stdin.readline()
sys.stdout.write(str(myStr) + "\n")
# Renaming the read/write methods for convenience
input = sys.stdin.readline
print = sys.stdout.write