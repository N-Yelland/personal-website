```python
"""
Heap-Splitting Nim

or
The Octal Game 0.777...
"""
import tkinter as tk
import random

def run(S):
    global app
    app = tk.Frame(game, bg="white")
    app.grid(row = 1)
    global btns
    btns = []
    for i,r in enumerate(S):
        btns.append([None]*r)
        for c in range(r):
            id = (i,c)
            btns[i][c] = tk.Button(app, height=1, width=2, text = '',
                command = lambda x=id: press(x))
            btns[i][c].grid(row = i+1, column = c, padx=1, pady=1)
    game.mainloop()

def update_selection(CPU=False,move=True):
    new_S = [0]
    for row in btns:
        if new_S[-1] != 0:
            new_S.append(0)
        for b in row:
            if b['text'] in ['+','X']:
                b.config(state=tk.DISABLED,text='X')
                if new_S[-1] != 0:
                    new_S.append(0)
            else:
                b.config(state=tk.NORMAL,text='')
                new_S[-1] += 1
    if move and not CPU:
        cpu_move(new_S)

def btn(btn_id):
    return btns[btn_id[0]][btn_id[1]]
#·
def press(ID):
    if btn(ID)['text'] in ['','-']:
        btn(ID).config(text = '+')
        for i,row in enumerate(btns):
            for j,b in enumerate(row):
                if i == ID[0] and abs(j - ID[1]) == 1 and b['text'] != 'X':
                    b.config(state=tk.NORMAL)
                    if b['text'] != '+':
                        b.config(text = '-')
                if (i != ID[0] or abs(j - ID[1]) > 1) and b['text'] not in ['-','+','X']:
                    b.config(state=tk.DISABLED, text='')
    elif btn(ID)['text'] == '+':
        nbours = 0
        for i,b in enumerate(btns[ID[0]]):
            if abs(i - ID[1]) == 1:
                if b['text'] == '-':
                    b.config(state=tk.DISABLED, text='')
                elif b['text'] == '+':
                    nbours += 1
        if nbours == 0:
            btn(ID).config(text = '')
            update_selection(move=False)
        elif nbours == 1:
            btn(ID).config(text = '-')

def nimsum(S):
    s = 0
    for a in S:
        s = s ^ a
    return s

def choices(S):
    choicedict = {'win':[],'lose':[]}
    for a in set(S):
        S.remove(a)
        for b in range(int((a+1)/2)):
            for c in range(b,a-b):
                choice = S + [b,c]
                if all([n <= 1 for n in choice]) != (nimsum(choice) == 0): #XOR statement
                    choicedict['win'].append([a,[b,c]])
                else:
                    choicedict['lose'].append([a,[b,c]])
        S.append(a)
    return choicedict

def cpu_move(S):
    moves = choices(S)
    if len(moves['win']) > 0:
        move = random.choice(moves['win'])
    elif len(moves['lose']) > 0:
        move = random.choice(moves['lose'])
        #print("CPU cannot find winning move")
    else:
        print("CPU Wins!")
        return None
    random.shuffle(move[1])
    a,b,c = move[0], move[1][0], move[1][1]
    
    print("CPU plays",a,"-->",b,c)
    
    stringS = ''
    for row in btns:
        if len(stringS) > 0:
            stringS += 'X'
        for button in row:
            if button['text'] == 'X':
                stringS += 'X'
            else:
                stringS += 'O'
    
    splitS = stringS.split('X')
    chosen_heap_index = random.choice([i for i,x in enumerate(splitS) if len(x) == move[0]])
    splitS[chosen_heap_index] = 'O'*b + 'X'*(a-b-c) + 'O'*c
    stringS = 'X'.join(splitS)
    
    i = 0
    for row in btns:
        for b in row:
            if stringS[i] == 'X':
                b.config(text = '+')
            i += 1
        i += 1
    update_selection(CPU=True)
    
    if all([s == 'X' for s in stringS]):
        print("Human Wins!")
        
    
def reset():
    app.destroy()
    print("====RESET====")
    run(S_0)

#GLOBAL VARIABLES
S_0 = [1,2,5,7]
btns = []

game = tk.Tk()
game.title("HeapSplitNim")
game.config(bg="white")

footer = tk.Frame(game, bg="white")
subfooter = tk.Frame(game, bg="white")


footer.grid(row=2, pady=10)        
submit = tk.Button(footer, text="Submit", command=update_selection)
submit.pack()

subfooter.grid(row=3, pady=5)
resetbtn = tk.Button(subfooter, text="Reset", command=reset)
resetbtn.grid(row=1,column=1,padx=5)
newS = tk.StringVar()
changeS = tk.Entry(subfooter, textvariable=newS)
changeS.grid(row=1,column=2,padx=5)

run(S_0)

```
