"use client";

import React, { useState, useEffect } from "react";
import { UserRound, Brain, Settings, RotateCcw, Clock, Trophy, Target, Menu, X } from "lucide-react";
import ModeToggle from "@/components/themeToggle";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
import ChessBoard from "@/components/chessBoard";
import GameStatus, { getGameStatusMessage } from "@/components/gameStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [userName, setUserName] = useState("");
  const [userColor, setUserColor] = useState<"white" | "black">("white");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState("");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalSquares, setLegalSquares] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const aiColor = userColor === "white" ? "black" : "white";
  const aiTurn = aiColor === "white" ? "w" : "b";
  const userTurn = userColor === "white" ? "w" : "b";

  useEffect(() => {
    setGameStatus("");
  }, []);

  // Start AI move if AI plays first (white)
  useEffect(() => {
    if (!isModalOpen && gameStartTime && game.fen() === new Chess().fen() && aiColor === "white") {
      setTimeout(() => requestAIMove(), 1000);
    }
  }, [isModalOpen, gameStartTime, aiColor]);

  async function requestAIMove(gameInstance?: Chess) {
    const currentGame = gameInstance || game;

    if (currentGame.isGameOver()) {
      updateGameStatus();
      return;
    }

    if (currentGame.turn() !== aiTurn) {
      console.error(`Error: AI called when it's not ${aiColor}'s turn`);
      return;
    }

    setIsAIThinking(true);
    setGameStatus("");
    toast.info("AI is thinking...", {
      duration: 2000,
    });

    try {
      const requestData = {
        legalMoves: currentGame.moves({ verbose: false }),
        currentBoard: currentGame.fen(),
        color: aiColor,
        userColor: userColor,
      };

      console.log("Sending to AI:", requestData);

      const res = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let text = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          text += chunk;
        }
      } finally {
        reader.releaseLock();
      }

      let moveString = text
        .replace(/^Move:\s*/i, "")
        .replace(/^AI Move:\s*/i, "")
        .replace(/^Black plays:\s*/i, "")
        .replace(/^White plays:\s*/i, "")
        .trim();

      const moveMatch = moveString.match(
        /\b([a-h][1-8][a-h][1-8][qrbnQRBN]?)\b/
      );
      if (moveMatch) {
        moveString = moveMatch[1].toLowerCase();
      }

      console.log("Parsed move:", moveString);

      const newGame = new Chess(currentGame.fen());

      let move;
      if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(moveString)) {
        const from = moveString.slice(0, 2);
        const to = moveString.slice(2, 4);
        const promotion = moveString.length === 5 ? moveString[4] : undefined;

        move = newGame.move({
          from,
          to,
          promotion: promotion || "q",
        });
      }

      if (!move) {
        const legalMoves = newGame.moves({ verbose: true });

        let sanMatches = legalMoves.filter((m) => m.san === moveString);

        if (sanMatches.length !== 1) {
          sanMatches = legalMoves.filter(
            (m) => m.san.toLowerCase() === moveString.toLowerCase()
          );
        }

        if (sanMatches.length !== 1) {
          const cleaned = moveString.replace(/[^a-z0-9]/gi, "").toLowerCase();
          sanMatches = legalMoves.filter(
            (m) => m.san.replace(/[^a-z0-9]/gi, "").toLowerCase() === cleaned
          );
        }

        if (sanMatches.length === 1) {
          move = newGame.move(sanMatches[0]);
        }
      }

      if (!move) {
        throw new Error(
          `Illegal, ambiguous, or unrecognized move: ${moveString}`
        );
      }

      setGame(newGame);
      setPosition(newGame.fen());

      console.log("AI played:", move.san);
      toast.success(`AI played: ${move.san}`, {
        duration: 3000,
      });
      setGameStatus("");

      const updatedHistory = [...moveHistory, move.san];
      setMoveHistory(updatedHistory);
      setMoveCount(updatedHistory.length);

      setTimeout(() => {
        updateGameStatus();
      }, 1000);
    } catch (error) {
      console.error("Error making AI move:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`AI Error: ${errorMessage}`, {
        duration: 5000,
      });

      // Fallback to random move
      const legalMoves = currentGame.moves({ verbose: true });
      if (legalMoves.length > 0) {
        const randomMove =
          legalMoves[Math.floor(Math.random() * legalMoves.length)];
        const newGame = new Chess(currentGame.fen());
        newGame.move(randomMove);
        setGame(newGame);
        setPosition(newGame.fen());
        setGameStatus("");
        toast.info(`AI played random move: ${randomMove.san}`, {
          duration: 3000,
        });
        setTimeout(updateGameStatus, 1000);
      }
    } finally {
      setIsAIThinking(false);
    } 
  }

  function updateGameStatus() {
    const status = getGameStatusMessage(game);
    setGameStatus(status);
    
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        const winner = game.turn() === "w" ? "Black" : "White";
        const isUserWinner = (winner.toLowerCase() === userColor);
        toast.success(`Checkmate! ${winner} wins! ${isUserWinner ? 'Congratulations!' : 'Better luck next time!'}`, {
          duration: 10000,
        });
      } else if (game.isDraw()) {
        toast.info("Game ended in a draw!", {
          duration: 5000,
        });
      } else if (game.isStalemate()) {
        toast.info("Stalemate! Game is a draw.", {
          duration: 5000,
        });
      }
    } else if (game.isCheck()) {
      const player = game.turn() === "w" ? "White" : "Black";
      toast.warning(`${player} is in check!`, {
        duration: 3000,
      });
    }
  }

  function newGame() {
    const newGameInstance = new Chess();
    setGame(newGameInstance);
    setPosition(newGameInstance.fen());
    setGameStatus("");
    setSelectedSquare(null);
    setLegalSquares([]);
    setIsAIThinking(false);
    setMoveHistory([]);
    setGameStartTime(new Date());
    setMoveCount(0);
    toast.success("New game started!", {
      duration: 2000,
    });

    // If AI plays white (goes first), start AI move after a short delay
    if (aiColor === "white") {
      setTimeout(() => requestAIMove(newGameInstance), 1000);
    }
  }

  function onSquareClick(args: { square: string }) {
    const square = args.square;
    if (selectedSquare && legalSquares.includes(square)) {
      if (isAIThinking || game.isGameOver()) return;
      if (game.turn() !== userTurn) return;

      const newGame = new Chess(game.fen());
      const move = newGame.move({
        from: selectedSquare,
        to: square,
        promotion: "q",
      });
      if (move === null) {
        setSelectedSquare(null);
        setLegalSquares([]);
        return;
      }
      setGame(newGame);
      setPosition(newGame.fen());
      setGameStatus("");
      setSelectedSquare(null);
      setLegalSquares([]);

      toast.success(`You played: ${move.san}`, {
        duration: 2000,
      });

      if (newGame.isGameOver()) {
        setTimeout(() => {
          const gameInstance = new Chess(newGame.fen());
          const status = getGameStatusMessage(gameInstance);
          setGameStatus(status);
          updateGameStatus();
        }, 500);
      } else {
        setTimeout(() => requestAIMove(newGame), 500);
      }

      const updatedHistory = [...moveHistory, move.san];
      setMoveHistory(updatedHistory);
      setMoveCount(updatedHistory.length);
      return;
    }

    const piece = game.get(square as Square);
    if (game.turn() === userTurn && piece && piece.color === userTurn) {
      setSelectedSquare(square);
      const moves = game.moves({ square: square as Square, verbose: true }) as {
        to: string;
      }[];
      setLegalSquares(moves.map((m) => m.to));
    } else {
      setSelectedSquare(null);
      setLegalSquares([]);
    }
  }

  function getCustomSquareStyles() {
    const highlightStyle = {
      background:
        "radial-gradient(circle, rgba(0, 0, 0, 0.5) 20%, transparent 20%)",
      borderRadius: "50%",
    };
    const selectedStyle = {
      background: "rgba(0, 0, 0, 0.7)",
    };
    const styles: { [square: string]: React.CSSProperties } = {};
    if (selectedSquare) styles[selectedSquare] = selectedStyle;
    legalSquares.forEach((sq) => {
      styles[sq] = highlightStyle;
    });
    return styles;
  }

  function onDrop(args: { sourceSquare: string; targetSquare: string | null }) {
    const { sourceSquare, targetSquare } = args;
    if (isAIThinking || game.isGameOver()) return false;
    if (!targetSquare) return false;
    if (game.turn() !== userTurn) return false;

    const newGame = new Chess(game.fen());
    const move = newGame.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move === null) return false;

    setGame(newGame);
    setPosition(newGame.fen());
    setGameStatus("");
    setSelectedSquare(null);
    setLegalSquares([]);

    toast.success(`You played: ${move.san}`, {
      duration: 2000,
    });

    if (newGame.isGameOver()) {
      setTimeout(() => {
        const gameInstance = new Chess(newGame.fen());
        const status = getGameStatusMessage(gameInstance);
        setGameStatus(status);
        updateGameStatus();
      }, 500);
    } else {
      setTimeout(() => requestAIMove(newGame), 500);
    }

    const updatedHistory = [...moveHistory, move.san];
    setMoveHistory(updatedHistory);
    setMoveCount(updatedHistory.length);

    return true;
  }

  const SidebarContent = () => (
    <div className="space-y-4">
      {/* Game Statistics */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Game Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center space-y-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Moves</span>
              <span className="text-gray-900 dark:text-white font-semibold text-xl">{moveCount}</span>
            </div>
            <div className="flex flex-col items-center space-y-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className={`w-5 h-5 rounded-full ${game.turn() === "w" ? "bg-white border-2 border-gray-300 dark:border-gray-600" : "bg-gray-800 dark:bg-gray-200 border-2 border-gray-300 dark:border-gray-600"}`} />
              <span className="text-gray-600 dark:text-gray-400 text-sm">Turn</span>
              <span className="text-gray-900 dark:text-white font-semibold text-xl">
                {game.turn() === "w" ? "White" : "Black"}
              </span>
            </div>
            {gameStartTime && (
              <div className="col-span-2 flex flex-col items-center space-y-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <Clock className="w-5 h-5 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400 text-sm">Game Time</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {Math.floor((Date.now() - gameStartTime.getTime()) / 60000)}m{" "}
                  {Math.floor(((Date.now() - gameStartTime.getTime()) % 60000) / 1000)}s
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Move History */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Move History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-40 overflow-y-auto text-sm space-y-1">
            {moveHistory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic text-center py-4">No moves yet</p>
            ) : (
              Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => {
                const whiteMove = moveHistory[i * 2];
                const blackMove = moveHistory[i * 2 + 1];
                return (
                  <div key={i} className="flex items-center gap-2 text-gray-800 dark:text-gray-200 py-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded px-1 transition-colors">
                    <Badge variant="outline" className="text-xs w-8 justify-center bg-gray-100 dark:bg-gray-700">
                      {i + 1}
                    </Badge>
                    <span className="min-w-0 flex-1 font-mono text-sm">{whiteMove}</span>
                    {blackMove && (
                      <span className="min-w-0 flex-1 font-mono text-sm text-right">{blackMove}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900 dark:text-white text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Click and drag pieces to move</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Click to select, then click destination</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Legal moves are highlighted</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p>Use "New Game" to reset</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-300">
      <GameStatus
        game={game}
        gameStatus={gameStatus}
        setGameStatus={setGameStatus}
      />
      
      {/* Settings Modal */}
      <Dialog 
        open={isModalOpen} 
        onOpenChange={(open) => {
          // Prevent closing the modal by outside clicks or escape key
          // Only allow closing when form is properly submitted
          if (!open && (!userName.trim() || !userColor)) {
            return; // Don't close if form is incomplete
          }
          setIsModalOpen(open);
        }}
      >
        <DialogContent 
          className="sm:max-w-md mx-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          onPointerDownOutside={(e) => {
            // Prevent closing on outside click
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing on escape key if form is incomplete
            if (!userName.trim() || !userColor) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Settings className="w-5 h-5" />
              Game Settings
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Please fill in all required fields to continue
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                Your Name 
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userName"
                placeholder="Enter your name"
                value={userName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                required
              />
              {!userName.trim() && (
                <p className="text-xs text-red-500 dark:text-red-400">Name is required</p>
              )}
            </div>
            <div className="space-y-3">
              <Label className="text-gray-700 dark:text-gray-300 flex items-center gap-1">
                Choose Your Color 
                <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={userColor} onValueChange={(value: "white" | "black") => setUserColor(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="white" id="white" />
                  <Label htmlFor="white" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-4 h-4 bg-white rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"></div>
                    White (You go first)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="black" id="black" />
                  <Label htmlFor="black" className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <div className="w-4 h-4 bg-black rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"></div>
                    Black (AI goes first)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-end">
              <ModeToggle />
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                if (userName.trim() && userColor) {
                  setIsModalOpen(false);
                  setGameStartTime(new Date());
                  toast.success("Game settings saved! Let's play!", {
                    duration: 2000,
                  });
                }
              }}
              disabled={!userName.trim() || !userColor}
            >
              Start Game
            </Button>
            {(!userName.trim() || !userColor) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Please complete all required fields to start the game
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {!isModalOpen && (
        <div className="container mx-auto p-2 sm:p-4 lg:p-6">
          <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
            {/* Main Game Area */}
            <div className="flex-1 min-w-0">
              <div className="max-w-4xl mx-auto">
                {/* Mobile Header with Menu */}
                <div className="flex items-center justify-between mb-4 xl:hidden">
                  <h1 className="text-gray-900 dark:text-white text-xl font-bold">Chess Game</h1>
                  <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                          <Menu className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                        <SheetHeader>
                          <SheetTitle className="text-gray-900 dark:text-white">Game Info</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6">
                          <SidebarContent />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                {/* Player Cards - Dynamic ordering based on board orientation */}
                {(userColor === "white" ? [
                  // AI on top, User on bottom when user is white
                  <Card key="ai" className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 mb-3 shadow-lg">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">AI Assistant</span>
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              Computer Player • {aiColor.charAt(0).toUpperCase() + aiColor.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAIThinking && (
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/50 text-xs">
                              Thinking...
                            </Badge>
                          )}
                          {game.turn() === aiTurn && !game.isGameOver() && !isAIThinking && (
                            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ] : [
                  // User on top, AI on bottom when user is black
                  <Card key="user" className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 mb-3 shadow-lg">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                            <AvatarFallback className="bg-green-100 dark:bg-green-900">
                              <UserRound className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{userName}</span>
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              Human Player • {userColor.charAt(0).toUpperCase() + userColor.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {game.turn() === userTurn && !game.isGameOver() && !isAIThinking && (
                            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ])}

                {/* Chess Board */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 mb-3 shadow-xl">
                  <CardContent className="p-2 sm:p-4 lg:p-6">
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 p-2 rounded-xl shadow-inner border border-amber-200 dark:border-amber-700">
                      <div className="w-full max-w-[600px] mx-auto aspect-square">
                        <ChessBoard
                          position={position}
                          onSquareClick={onSquareClick}
                          onPieceDrop={onDrop}
                          customSquareStyles={getCustomSquareStyles()}
                          boardOrientation={userColor}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom Player Card */}
                {(userColor === "white" ? [
                  // User on bottom when user is white
                  <Card key="user" className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 mb-4 shadow-lg">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                            <AvatarFallback className="bg-green-100 dark:bg-green-900">
                              <UserRound className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{userName}</span>
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              Human Player • {userColor.charAt(0).toUpperCase() + userColor.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {game.turn() === userTurn && !game.isGameOver() && !isAIThinking && (
                            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ] : [
                  // AI on bottom when user is black
                  <Card key="ai" className="border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 mb-4 shadow-lg">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900">
                              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">AI Assistant</span>
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              Computer Player • {aiColor.charAt(0).toUpperCase() + aiColor.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAIThinking && (
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/50 text-xs">
                              Thinking...
                            </Badge>
                          )}
                          {game.turn() === aiTurn && !game.isGameOver() && !isAIThinking && (
                            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ])}

                {/* Game Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={newGame}
                    variant="outline"
                    className="flex-1 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    disabled={isAIThinking}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Game
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex-1 sm:flex-none"
                        disabled={isAIThinking}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="mx-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">Game Settings</DialogTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Update your game preferences
                        </p>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="gameUserName" className="text-gray-700 dark:text-gray-300">Your Name</Label>
                          <Input
                            id="gameUserName"
                            value={userName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
                            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            placeholder="Enter your name"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-gray-700 dark:text-gray-300">Choose Your Color</Label>
                          <RadioGroup value={userColor} onValueChange={(value: "white" | "black") => setUserColor(value)}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="white" id="gameWhite" />
                              <Label htmlFor="gameWhite" className="flex items-center gap-2 text-gray-900 dark:text-white">
                                <div className="w-4 h-4 bg-white rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"></div>
                                White (You go first)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="black" id="gameBlack" />
                              <Label htmlFor="gameBlack" className="flex items-center gap-2 text-gray-900 dark:text-white">
                                <div className="w-4 h-4 bg-black rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"></div>
                                Black (AI goes first)
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="pt-2">
                          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                            ⚠️ Changing color will start a new game
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden xl:block w-80 shrink-0">
              <div className="sticky top-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-gray-900 dark:text-white text-lg font-semibold">Game Information</h2>
                    <ModeToggle />
                </div>
                <SidebarContent />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
