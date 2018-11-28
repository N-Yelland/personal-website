```python

# Quarternions
def addc(pc,qc):
   """addc(pc,qc): adds the lists pc and qc as polynomials"""
   if len(pc) < len(qc):
      pc,qc = qc,pc
   tc = pc[:]
   for j in range(len(qc)):
      tc[j] += qc[j]
   return tc


class Qtrn:
    
    def __init__(self, *coeffs):
        self._c = list(coeffs)
        while len(self._c) < 4:
            self._c.append(0)
        
    def __add__(self,other):
      """implements q1 + q2"""
      vc = self._c
      wc = other._c
      tc = addc(vc,wc)
      return Qtrn(*tc)
    
    def __sub__(self, other):
        """implements q1 - q2 """
        s = [-c for c in other._c]
        return Qtrn(*addc(s,self._c))
    
    def __mul__(self, other):
        """implements q1 * q2 """
        p = Qtrn()._c
        for i in range(4):
            for j in range(4):
                if i == j:
                    c = 0
                    sgn = 1 if i == 0 else -1
                elif i == 0 or j == 0:
                    c = max([i,j])
                    sgn = 1
                else:
                    c = 6 - i - j
                    sgn = (-1)**(1 + ((i-j+2) % 3))
                p[c] += self._c[i] * other._c[j] * sgn
        return Qtrn(*p)
        # NB: the methodology is quite esoteric, and will probably redone, to more
        # intuitively reflect the symmetry of the Quaternion group
    
    def __str__(self):
        """ implements print(q1) """
        c = ["","i","j","k"]
        w = self._c
        s = ""
        for i in range(4):
            if w[i] != 0:
                if w[i] > 0 and i != 0:
                    s += "+"
                s += str(w[i]) + c[i] + " "
        return s
    
    def __div__(self,other):
        q1 = self._c
        q2 = self._c
        #invert q2 and then return q1 * inverse(q2)
        #incomplete!
```
