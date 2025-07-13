import React, { forwardRef, useImperativeHandle } from "react";
import { Chess } from "chess.js";

interface GameStatusMessagesProps {
  game: Chess;
  gameStatus: string;
  setGameStatus: React.Dispatch<React.SetStateAction<string>>;
}

const getGameStatusMessage = (game: Chess): string => {
  if (game.isCheckmate()) {
    return game.turn() === "w"
      ? "Black wins by checkmate! Game over."
      : "White wins by checkmate! Game over.";
  }
  if (game.isDraw()) {
    if (game.isStalemate()) return "Game drawn by stalemate! No legal moves available.";
    if (game.isInsufficientMaterial()) return "Game drawn by insufficient material!";
    if (game.isThreefoldRepetition()) return "Game drawn by threefold repetition!";
    return "Game drawn!";
  }
  if (game.isCheck()) {
    return game.turn() === "w" ? "White is in check!" : "Black is in check!";
  }
  return "";
};

const GameStatusMessages = forwardRef(function GameStatusMessages(
  { game, gameStatus, setGameStatus }: GameStatusMessagesProps,
  ref
) {
  useImperativeHandle(ref, () => ({
    updateGameStatus: () => {
      setGameStatus(getGameStatusMessage(game));
    },
  }));

  return gameStatus ? (
    <div className="fixed top-10 sm:top-16 left-0 right-0 mx-4 sm:mx-0">
      <div className="bg-transparent text-white rounded p-2 sm:p-4 text-center text-sm sm:text-base font-normal max-w-md mx-auto">
        {gameStatus}
      </div>
    </div>
  ) : null;
});

export default GameStatusMessages;
export { getGameStatusMessage };
