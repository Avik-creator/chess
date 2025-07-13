"use client";

import React, { useState, useEffect } from "react";
import { UserRound, Brain, Settings, RotateCcw, Clock, Trophy, Target, Menu, X } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [model, setModel] = useState("");
  const [userName, setUserName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState("");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalSquares, setLegalSquares] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setGameStatus("");
  }, []);

  async function requestAIMove(gameInstance?: Chess) {
    const currentGame = gameInstance || game;

    if (currentGame.isGameOver()) {
      updateGameStatus();
      return;
    }

    if (currentGame.turn() !== "b") {
      console.error("Error: AI called when it's not Black's turn");
      return;
    }

    setIsAIThinking(true);
    setGameStatus("");
    toast.info("AI is thinking...", {
      duration: 2000,
    });

    try {
      const requestData = {
        fen: currentGame.fen(),
        legalMoves: currentGame.moves({ verbose: false }),
        model,
      };

      console.log("Sending to AI:", {
        turn: currentGame.turn(),
        fen: requestData.fen,
        legalMovesCount: requestData.legalMoves.length,
        sampleMoves: requestData.legalMoves.slice(0, 5),
      });

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

      console.log("AI response:", text);

      let moveString = text
        .replace(/^Move:\s*/i, "")
        .replace(/^AI Move:\s*/i, "")
        .replace(/^Black plays:\s*/i, "")
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
        toast.success(`Checkmate! ${winner} wins!`, {
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
  }

  function onSquareClick(args: { square: string }) {
    const square = args.square;
    if (selectedSquare && legalSquares.includes(square)) {
      if (isAIThinking || game.isGameOver()) return;
      if (game.turn() !== "w") return;

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
    if (game.turn() === "w" && piece && piece.color === "w") {
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
    if (game.turn() !== "w") return false;

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
      <Card className="border-white/20 bg-black/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5" />
            Game Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center space-y-1">
              <Target className="w-5 h-5 text-white/60" />
              <span className="text-white/60 text-sm">Moves</span>
              <span className="text-white font-semibold text-xl">{moveCount}</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div className={`w-5 h-5 rounded-full ${game.turn() === "w" ? "bg-white" : "bg-black border border-white"}`} />
              <span className="text-white/60 text-sm">Turn</span>
              <span className="text-white font-semibold text-xl">
                {game.turn() === "w" ? "White" : "Black"}
              </span>
            </div>
            {gameStartTime && (
              <div className="col-span-2 flex flex-col items-center space-y-1">
                <Clock className="w-5 h-5 text-white/60" />
                <span className="text-white/60 text-sm">Game Time</span>
                <span className="text-white font-semibold">
                  {Math.floor((Date.now() - gameStartTime.getTime()) / 60000)}m{" "}
                  {Math.floor(((Date.now() - gameStartTime.getTime()) % 60000) / 1000)}s
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Move History */}
      <Card className="border-white/20 bg-black/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Move History</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-40 overflow-y-auto text-sm space-y-1">
            {moveHistory.length === 0 ? (
              <p className="text-white/60 italic text-center py-4">No moves yet</p>
            ) : (
              Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => {
                const whiteMove = moveHistory[i * 2];
                const blackMove = moveHistory[i * 2 + 1];
                return (
                  <div key={i} className="flex items-center gap-2 text-white/80 py-1">
                    <Badge variant="outline" className="text-xs w-8 justify-center">
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
      <Card className="border-white/20 bg-black/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-white/70 space-y-2">
            <p>• Click and drag pieces to move</p>
            <p>• Click to select, then click destination</p>
            <p>• Legal moves are highlighted</p>
            <p>• Use "New Game" to reset</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <GameStatus
        game={game}
        gameStatus={gameStatus}
        setGameStatus={setGameStatus}
      />
      
      {/* Settings Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Game Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Your Name</Label>
              <Input
                id="userName"
                placeholder="Enter your name"
                value={userName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3">Claude 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                if (userName && model) {
                  setIsModalOpen(false);
                  setGameStartTime(new Date());
                  toast.success("Game settings saved! Let's play!", {
                    duration: 2000,
                  });
                }
              }}
              disabled={!userName || !model}
            >
              Start Game
            </Button>
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
                  <h1 className="text-white text-xl font-bold">Chess Game</h1>
                  <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="border-white/30 text-white">
                        <Menu className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80 bg-gray-900 border-gray-700">
                      <SheetHeader>
                        <SheetTitle className="text-white">Game Info</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <SidebarContent />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* AI Player Info (Top) */}
                <Card className="border-white/20 bg-black/80 mb-3">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                          <AvatarFallback className="bg-white/10">
                            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-base sm:text-lg">AI Assistant</span>
                          <span className="text-xs sm:text-sm text-white/60">
                            Computer Player • Black
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAIThinking && (
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/50 text-xs">
                            Thinking...
                          </Badge>
                        )}
                        {game.turn() === "b" && !game.isGameOver() && !isAIThinking && (
                          <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chess Board */}
                <Card className="border-white/30 bg-black/80 mb-3">
                  <CardContent className="p-2 sm:p-4 lg:p-6">
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-1 rounded-lg shadow-inner">
                      <div className="w-full max-w-[600px] mx-auto aspect-square">
                        <ChessBoard
                          position={position}
                          onSquareClick={onSquareClick}
                          onPieceDrop={onDrop}
                          customSquareStyles={getCustomSquareStyles()}
                          boardOrientation="white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Human Player Info (Bottom) */}
                <Card className="border-white/20 bg-black/80 mb-4">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                          <AvatarFallback className="bg-white/10">
                            <UserRound className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-base sm:text-lg">{userName}</span>
                          <span className="text-xs sm:text-sm text-white/60">
                            Human Player • White
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {game.turn() === "w" && !game.isGameOver() && !isAIThinking && (
                          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={newGame}
                    variant="outline"
                    className="flex-1 border-white/30 hover:border-white hover:bg-white/10 text-white"
                    disabled={isAIThinking}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Game
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-white/30 hover:border-white hover:bg-white/10 text-white flex-1 sm:flex-none"
                        disabled={isAIThinking}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="mx-4">
                      <DialogHeader>
                        <DialogTitle>Game Settings</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="userName">Your Name</Label>
                          <Input
                            id="userName"
                            value={userName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="model">AI Model</Label>
                          <Select value={model} onValueChange={setModel}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                              <SelectItem value="claude-3">Claude 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden xl:block w-80 shrink-0">
              <div className="sticky top-6">
                <SidebarContent />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
