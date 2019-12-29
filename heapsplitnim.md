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
    submit.config(text='CPU Start', state=tk.ACTIVE)
    submit.grid()
    msg.grid_forget()
    game.mainloop()

def update_selection(CPU=False,move=True):
    if submit['text'] != 'Submit':
        submit.config(text = 'Submit', state=tk.DISABLED)
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
    submit.config(text='Submit', state=tk.ACTIVE)
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
            submit.config(state=tk.DISABLED)
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
        submit.grid_forget()
        msg.config(text = 'CPU Wins!')
        msg.grid()
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
        submit.grid_forget()
        msg.config(text = 'Human Wins!')
        msg.grid()

def validate(parent,string):
    # checking if string is of integer list format
    try:
        lst = [n for n in string.split(',')]
        if all([ (n.isdigit()) for n in lst]):
            if all([int(n) != 0 for n in lst]):
                parent.destroy()
                reset(S=[int(n) for n in lst])
            else:
                int('1.1')
    except:
        alert = tk.Toplevel(parent)
        error = tk.Label(alert, text='Invalid Entry. Please try again.')
        error.pack()

def change_S():
    window = tk.Toplevel(game)
    instructions = 'Enter a series of integers separated by commas, each one is the number of boxes in each row of a new grid.'
    txtmsg = tk.Label(window,text=instructions, wraplength=200, justify=tk.LEFT)
    txtmsg.grid(row=1,column=1)
    
    new_S = tk.StringVar()
    e = tk.Entry(window, textvariable=new_S)
    submitbtn = tk.Button(window, text='Submit', command= lambda: validate(window,new_S.get()))
    e.grid(row=2, column=1)
    submitbtn.grid(row=2, column=2)
       
#GLOBAL VARIABLES
S_0 = [1,2,5,7]
btns = []

def reset(S=S_0):
    app.destroy()
    print("====RESET====")
    run(S)

game = tk.Tk()
game.title("HeapSplitNim")
game.config(bg="white")

footer = tk.Frame(game, bg="white")
subfooter = tk.Frame(game, bg="white")


footer.grid(row=2, pady=10)        
submit = tk.Button(footer, text="Submit", command=update_selection)
submit.grid(row=1, column=1)
msg = tk.Label(footer, text='', font='Helvetica 16 bold',bg='white')
msg.grid(row=1, column=2)

subfooter.grid(row=3, pady=5)
resetbtn = tk.Button(subfooter, text="Reset", command=reset)
resetbtn.grid(row=1,column=1,padx=5)
editbtn = tk.Button(subfooter, text="Setup", command=change_S)
editbtn.grid(row=1,column=2,padx=5)
quitbtn = tk.Button(subfooter, text="Quit", command=lambda: game.destroy())
quitbtn.grid(row=1, column=3, padx=5)

run(S_0)


```
