# Python Brainfuck Interpreter

```python
"""
Brainfuck Compiler and Interpreter

UI implemented with tkinter
"""

import os
import webbrowser
import time

import tkinter as tk
from tkinter.filedialog import askopenfile, asksaveasfilename

## User Interface

def get_input():
    return Input.get("1.0",'end-1c')

def set_input(s):
    Input.delete("1.0",'end')
    Input.insert("1.0",s)
    
def set_output(s):
    Output.delete("1.0",'end')
    Output.insert('end',s)
    
def load_file():
    f = askopenfile(initialdir = os.getcwd(), title = "Select file", filetypes = [("Text files","*.txt")])
    if f is not None:
        content = f.read()
        set_input(content)

def save_file():
    fname = asksaveasfilename(initialdir = os.getcwd(), title = "", filetypes = [("Text files","*.txt")])
    if fname is not None:
        f= open(fname+".txt", "w+")
        f.write(get_input())
        f.close()
    
def get_help():
    webbrowser.open("https://esolangs.org/wiki/Brainfuck")
    
## BF Code Interpretation


def run():
    tape = [0]
    pointer = 0
    
    # removes comments
    raw = get_input()
    
    charset = [">","<","+","-",".",",","[","]"]
    code = []
    for char in list(raw):
        if char in charset:
            code.append(char)
    Input.config(state=tk.DISABLED)
    
    
    # parses parentheses
    opens = [i for i in range(len(code)) if code[i] == "["]
    closes= [i for i in range(len(code)) if code[i] == "]"]
    
    pairs = {}
    for z in closes:
        a = max([i for i in opens if i < z])
        pairs[z], pairs[a] = a, z
        opens.remove(pairs[z])
    
    output = ""
    i,nops = 0,0
    while i < len(code):
        if code[i] == ">":
            pointer += 1
            #extends tape if necessary
            if pointer > len(tape)-1:
                tape += [0]
        if code[i] == "<":
            pointer += -1
            #the pointer can't go further back than zero
            if pointer < 0:
                pointer == 0
        if code[i] == "+":
            tape[pointer] = (tape[pointer] + 1)%256
        if code[i] == "-":
            tape[pointer] = (tape[pointer] - 1)%256
        if code[i] == ".":
            output += chr(tape[pointer])
        if code[i] == ",":
            prompt = tk.Toplevel(root)
            prompt.title("Input Prompt")
            lbl = tk.Label(prompt, text="Awaiting Input. Press Any Key").pack()
            inpt = tk.StringVar()
            inpt.trace("w", lambda name, index, mode: prompt.destroy())
            root.bind("<Key>", lambda event:
                inpt.set(str(event.char)) if event.char != '' or event.keysym == 'Return' else None)
            root.wait_window(prompt)
            try:
                tape[pointer] = ord(inpt.get())
            except:
                tape[pointer] = 0
                        
        if code[i] == "[":
            if tape[pointer] == 0:
                i = pairs[i]
                #will throw up an error if parentheses are unmatched
        if code[i] == "]":
            if tape[pointer] != 0:
                i = pairs[i]
        i += 1
        nops += 1
        set_output(output)
        
    
    Input.config(state=tk.NORMAL)
    print(tape,nops)
    
def ascii_tool():
    
    def asc2den(sv):
        if sv.get() != "":
            den.set(ord(sv.get()[0]))
    def den2asc(sv):
        if sv.get() != "":
            asc.set(chr(int(sv.get())%128))
    
    tool = tk.Toplevel(root)
    tool.title("ASCII Converter Tool")
    l1 = tk.Label(tool, text="ASCII").grid(row=0,column=0)
    l2 = tk.Label(tool, text="Denary").grid(row=0, column=1)
    
    asc = tk.StringVar()
    asc.trace("w", lambda name, index, mode, sv=asc: asc2den(sv))
    den = tk.StringVar()
    den.trace("w", lambda name, index, mode, sv=den: den2asc(sv))
    
    ascIO = tk.Entry(tool, textvariable=asc, width= 10, justify="center")
    denIO = tk.Entry(tool, textvariable=den, width= 10, justify="center")
    ascIO.grid(row=1, column=0)
    denIO.grid(row=1, column=1)

    

root = tk.Tk()
root.title("Brainfuck Interpreter")
root.geometry("410x450+20+20")

s = tk.Button(root, command=save_file, text="SAVE", relief=tk.RAISED, width=5).grid(row=0, column=0)
l = tk.Button(root, command=load_file, text="LOAD", relief=tk.RAISED, width=5).grid(row=0, column=1)
r = tk.Button(root, command=run, text="RUN", relief=tk.RAISED, width=5).grid(row=0, column=2)
h = tk.Button(root, command=get_help, text="HELP", relief=tk.RAISED, width=5).grid(row=0, column=3)
#st= tk.Button(root, command=step_through, text="STEP", relief=tk.RAISED, width=5).grid(row=0, column=4)
a = tk.Button(root, command=ascii_tool, text="ASCII", relief=tk.RAISED, width=5).grid(row=0, column=4)

Input = tk.Text(root, width=25)
Input.grid(row=2,column=0, columnspan=4, pady=5)
Output = tk.Text(root, width=25)
Output.grid(row=2,column=4, columnspan=4, pady=5)

root.mainloop()
```
