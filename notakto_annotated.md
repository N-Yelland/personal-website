###  0. Import relevant modules:
#    tkinter for GUI
#    random for CPU's random choices
#    re (RegExp) for condensed string parsing from JS
from tkinter import *
import random
import re


### 1. Building Game Environment

## 1.1 Initiates game window
game = Tk()
game.title("Notakto")
game.config(bg="white")

## 1.2 Draws up subspaces of window
app = Frame(game, bg="white")
footer = Frame(game, bg="white")
subfooter = Frame(game, bg="white")
app.grid(row = 1)
footer.grid(row = 2, pady=10)
subfooter.grid(row = 3)

boardcount = 4
# Boardcount is the number of 3x3 grids the game is played with. 3 is recommened, 1 is trivial.
# NB: If it is odd, the player to move first should win, otherwise the second player should win,
# assuming both players play perfectly.

## 1.3 Initiates data structures for game
#  gameMatrix is an array of handlers for the button objects (widgets)
#  gameState is an array encoding the game, where 0 is an empty square and 1 is a filled square
#  gridsDead is True at position n if grid n is "Dead", i.e: contains 3 in a row
gameMatrix = []
gameState  = []
gridsDead = [False]*boardcount

# These two arrays use the uniqueness of prime factorisation to encode particular positions.
# For lethal_factors, should a grids "value" contain this factor, it is dead as it has 3 in a row
# For code_vals, it relates the 46 non-dead, non-isomorphic arrangements of stones to a particular "code",
# that must combine in a particular way if the player is to win. It is through these rules that the CPU
# can calculate winning moves.
lethal_factors = [2*7*17, 3*11*19, 5*13*23, 7*11*13, 2*3*5, 7*11*13, 17*19*23, 2*11*23, 5*11*17]
code_vals = [
                ["c", [1]],
                ["ad", [2*3]],
                ["cc", [11]],
                ["d",  [2*3*13, 2*3*19, 2*3*23]],
                ["",  [2, 3, 2*13*19]],
                ["ab", [2*3*11, 2*5*17, 3*7*11, 2*3*13*23, 2*3*13*19]],
                ["b",  [2*5, 2*11, 2*13, 3*11, 2*3*7, 3*7*13, 2*3*11*13, 2*3*11*17, 2*3*13*17, 2*3*17*19, 2*3*17*23, 
                        2*5*11*19, 2*11*13*19, 2*3*7*13*19, 2*3*7*13*23]],
                ["a", [2*23, 3*7, 3*19, 2*3*17, 2*5*11, 2*5*19, 2*11*13, 2*3*7*11, 2*3*7*13, 2*3*7*23, 2*3*19*23,
                      2*5*17*23, 3*7*13*19, 2*3*11*13*17, 2*3*13*17*19, 2*3*13*17*23, 2*3*7*13*19*23]]
            ]

## 1.4 Builds Game Grids
#  The dimensions of the grids must be 3x3
for b in range(boardcount):
    gameMatrix.append([])
    gameState.append([])
    blank = Label(app, height=1, width=2, bg="white")
    for r in range(-1,3):
        if r == -1:
            l = Label(app, height=1, width=2, bg="white").grid(row = 0, columnspan = 10)
        else:
            col = b*4+1
            gameMatrix[b].append([])
            gameState[b].append([0,0,0])
            l = Label(app, height=1, width=2, bg="white").grid(row = r+1, column = 0)
            for c in range(4):
                if c == 3:
                    blank.grid(row = r+1, column = col)
                else:
                    id = "{x}b{y}r{z}c".format(x=b, y=r, z=c)
                    gameMatrix[b][r].append(Button(app, height=1, width=2, bg="white", command=lambda x=id:player_move(x)))
                    #player_move is the on-click function that confirms the players decision and inititaes the computer's turn.
                    gameMatrix[b][r][c].grid(row = r+1, column = col, padx=1, pady=1)
                col += 1

## 1.5 Function to Restart Game, and the Restart and Quit Buttons
def reset_game():
    global gridsDead
    gridsDead = [False]*boardcount
    print("\n\nGame restarted by player")
    for g in range(boardcount):
        for r in range(3):
            for c in range(3):
                gameMatrix[g][r][c].config(text="", state=NORMAL, bg="white")
                gameState[g][r][c] = 0
    launchcode()
reset_button = Button(footer, text="Reset Game", command=reset_game, bg="white").grid(row = 1, column = 1, padx=10)
quit_button = Button(footer, text="Quit", command=game.destroy, bg="white").grid(row = 1, column = 2, padx=10)

def show_rules():
    rules = ["Notakto is a tic-tac-toe variant, played across one or several boards with both players playing the same piece.",
             "If a board has a three-in-a-row, it is \'dead\', and  it cannot be played on anymore.",
             "The game ends when all the boards contain a three-in-a-row, at which point the player to have made the last move loses."
             ]
    rulebox = Toplevel(game, bg="white")
    for i in range(len(rules)):
        line = Label(rulebox, text=rules[i], bg="white").grid(row = i, padx=20, sticky=W)
    close_button = Button(rulebox, text="Close", bg="white", command=rulebox.destroy).grid(row=len(rules), pady=15)
rule_button = Button(footer, text="Show Rules", command=show_rules, bg="white").grid(row = 1, column = 3, padx=10)


def toggle_p1():
    global firstmove
    if firstmove == "P1":
        firstmove = "CPU"
    else:
        firstmove = "P1"
    print("\n    " + firstmove + " will start next game.")
    toggle_button["text"] = firstmove + " starts"
firstmove = "P1"
toggle_button = Button(subfooter, text="P1 starts", command=toggle_p1, bg="white")
toggle_button.grid(row = 2, column = 2, pady=10, stick=N)
        
    


### 2. Gameplay Functions

## 2.1 Player Move
#  called when the player presses any button to "place a stone"
def player_move(x):
    place_stone(x, "P1")
    computer_move(gameState)
    #computer_move(gameState, "Y") # Comment out this line to disable hints in the console.


## 2.2 Computer Move
#  NB: putting "Y" as the second argument will print the move to the console instead of doing it.
def computer_move(gs, hint="N"):
    
    # 2.2.0 Initiates Variables
    #    -  all_moves are all the moves CPU has considered (i.e: all legal moves)
    #    -  win_moves are moves that could enable CPU to win
    #    -  kill_moves are winning moves that also cause a grid to "die", theoretically
    #       shortening the game, giving P1 less time to recover and thus improving CPU's chances.
    all_moves, win_moves, kill_moves = [],[],[]
    move = None
    # win_codes are the magical "game codes" that determine whether or not a move is "winning",
    # i.e: the play who made it can go on to win from that move. For why, see https://arxiv.org/pdf/1301.1672.pdf
    win_codes = ["a","bb","bc","cc"]
    
    # 2.2.1 Iterates through all board spaces
    for g in range(boardcount):
        for r in range(3):
            for c in range(3):
                
                # This block is necessary to deepcopy the 3d array without linking them
                test_gs = [] 
                for g2 in range(boardcount):
                    grid = []
                    for r2 in range(3):
                        grid.append(gs[g2][r2][:])
                    test_gs.append(grid)
                
                # 2.2.2 CPU makes Hypothetical Move
                #       (providing the space is empty and in a non-dead grid)
                if gs[g][r][c] == 0 and not gridsDead[g]:
                    test_gs[g][r][c] = 1;
                    all_moves.append([g,r,c])
                    test_gsCode = get_gsCode(test_gs)
                    
                    # 2.2.3 Test if Move is Winning, etc.
                    try:
                        x = win_codes.index(test_gsCode)
                        win_moves.append([g,r,c])
                        board_val = get_boardVal(test_gs[g])
                        for f in lethal_factors:
                            if board_val % f == 0:
                                kill_moves.append([g,r,c])
                    except:
                        None
    # 2.2.4 Move Selection
    #       The CPU will pick a random killing move, and then if there are none,
    #       a random winning move, and if that too fails, any random (legal) move.
    if not all(gridsDead):
        if len(kill_moves) > 0:
            move = random.choice(kill_moves)
        elif len(win_moves) > 0:
            move = random.choice(win_moves)
        else:
            move = random.choice(all_moves)
        
        # 2.2.5 Place Stone
        if hint != "Y":
            place_stone(str(move[0])+"b"
                        +str(move[1])+"r"
                        +str(move[2])+"c", "CPU")
        else:
            # If CPU is instructed to give a hint it prints its move to console
            # rather than placing a stone on the board.
            if len(win_moves) > 0:
                print("\nHINT:",move)
            else:
                print("\nHINT: No winning moves found")                                          


## 2.3 Calculate Board Value
def get_boardVal(board):
    # Each space of each grid corresponds to a unique prime of the first 9:
    #    2 |  3 |  5
    #   ---+----+---
    #    7 | 11 | 13
    #   ---+----+---
    #   17 | 19 | 23
    # Their product therefore uniquely specifies a board state
    # due to the uniqueness of prime factorisation.
    P = [2, 3, 5, 7, 11, 13, 17, 19, 23]
    val = 1
    for r in range(3):
        for c in range(3):
            if board[r][c] == 1:
                val *= P[3*r + c]
    return val


## 2.4 Calculate Board Code
#      This function expresses the entire board as a single string, in accordance
#      to the codes in code_vals and the simplification rules outlined below.
def get_gsCode(gs):
    
    # 2.4.0 Initiates Variables
    gridVals = [None] * boardcount
    gsCode= ""
    
    # 2.4.1 Iterates through all the grids
    for g in range(boardcount):
        board = gs[g]
        gridVals[g] = get_boardVal(board)
        trans = 0
        # code_vals is non-isomorphic, so we must accound for translations and reflections of the grid,
        # giving 8 symmetries tracked by the variable "trans"
        while trans < 8:
            
            # 2.4.2 Ignores the grid if it is dead: Dead grids contribute nothing to the code
            for f in lethal_factors:
                if gridVals[g] % f == 0:
                    gsCode += ""
                    trans = 8
                    break
                
            # 2.4.3 Iterates through code_vals to find a match
            for code in code_vals:
                brk = False
                for val in code[1]:
                    if gridVals[g] == val:
                        gsCode += code[0]
                        brk = True
                        break
                if brk:
                    trans = 8
                    break
            
            # 2.4.4 At the end of each cycle the board is transformed to check all cases.          
            if trans != 4:
                board = rotate(board)
            elif trans == 4:
                board = rotate(board)[::-1]
            gridVals[g] = get_boardVal(board)
            trans += 1
    
    # 2.4.5 Code Simplification
    #       The gsCode must be simplifed according to the following rules:
    #           aa  => ""
    #           bbb => b
    #           bbc => c
    #           ccc => acc
    #           bbd => d    <-- non-consecutive!
    #           cd  => ad
    #           dd  => cc
    #       Which, due to their consecutive nature, is generally easily accomplished,
    #       with a special case for bbd => d.
    codemap = {
        "aa" : "",
        "bbb": "b",
        "bbc": "c",
        "ccc": "acc",
        "cd" : "ad",
        "dd" : "cc"
    }
    rx = re.compile("|".join(codemap.keys()))
    while rx.search(gsCode):
        match = rx.search(gsCode).group(0)
        gsCode = gsCode.replace(match, codemap[match])
        
        #Special case:
        if "bb" in gsCode and "d" in gsCode:
            gsCode = gsCode.replace("bb","")
        gsCode = "".join(sorted(gsCode))
    return gsCode


## 2.5 Places stone at "id", as placed by "player"
def place_stone(id, player):
    stone = getStone(id)
    
    # Updates visuals
    stone.config(text="⬛", state=DISABLED, disabledforeground="black")
    s = getStone(id, "coords only")
    print("\n", player, "placed a stone at", s)
    gameState[s[0]][s[1]][s[2]] = 1
    check_grids(player)
    
    
## 2.6 Checks Grids to see if they are "Dead"
def check_grids(player):
    gridVals = [None] * boardcount
    for g in range(boardcount):
        gridVals[g] = get_boardVal(gameState[g])
    for g in range(boardcount):
        for f in lethal_factors:
            if gridVals[g] % f == 0:
                kill_grid(g)
                break
            
    # If all the grids are dead, an alert window gives the winner 
    if all(gridsDead):
        winner = "P1" if player == "CPU" else "CPU"
        msg = winner + " WINS!"
        alert = Toplevel(game, bg="white")
        label = Label(alert, text=msg, font=("Courier", 40, "bold"), bg="white").pack(padx=5,pady=5)
        print("\n" + msg)


## 2.7 Kill Grid
def kill_grid(g):
    # Updates gridsDead
    gridsDead[g] = True
    
    # Updates visuals
    for r in range(3):
        for c in range(3):
            stone = getStone(g, r, c)
            stone.config(state=DISABLED, bg="SystemButtonFace", fg="SystemWindowFrame")



### 3. Utility Functions

## 3.1 Get Stone
#      Designed to take a number of argument formats:
#      (a) getStone(X, Y, Z) returns button handler at [X, Y, Z]
#      (b) getStone(id) return button handler at id: XbYrZc
#      (c) getStone(id, "flag") returns [X, Y, Z] from id: XbYrZc
def getStone(id,*args):
    b,r,c = 0,0,0
    
    # Case for (b), (c):
    if len(args) != 2: 
        indexB = id.find("b")
        indexR = id.find("r")
        b = int(id[:indexB])
        r = int(id[indexB+1:indexR])
        c = int(id[indexR+1:len(id)-1])
        
    # Case for (a):
    elif len(args) == 2: 
        b, r, c = id, args[0], args[1]
    
    # Case distinguishing (c) from (b) and (a):
    if len(args) == 1:
        return [b,r,c]
    else:
        return gameMatrix[b][r][c]


## 3.2 Rotates 2d matrix "a" by 90 degrees clockwise
def rotate(a):
    a2 = zip(*a[::-1])
    return [list(i) for i in a2]



### 4. Launch Code
#   Code here runs when the program is first run, along with after it is reset.
def launchcode():
    print("\nStarting new game...")
    if firstmove == "CPU":
        computer_move(gameState)
launchcode()
