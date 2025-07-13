import React from "react";
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";

interface ChessBoardProps {
    position: string | { [square: string]: { pieceType: string, color: string } };
    onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
    onSquareClick: (args: SquareHandlerArgs) => void;
    customSquareStyles?: Record<string, React.CSSProperties>;
    boardOrientation?: "white" | "black";
}

const ChessBoard: React.FC<ChessBoardProps> = ({ position, onPieceDrop, onSquareClick, customSquareStyles,boardOrientation }) => {
    const chessboardOptions = {
        position: position,
        onPieceDrop: onPieceDrop,
        onSquareClick: onSquareClick,
        customSquareStyles: customSquareStyles,
        boardOrientation: boardOrientation,
        customDarkSquareStyle: { backgroundColor: "#779556" },
        customLightSquareStyle: { backgroundColor: "#eeeed2" },
        areArrowsAllowed: false,
        arePiecesDraggable: false,
    };

    return (
        <div className="w-full aspect-square max-w-full sm:max-w-[400px] md:max-w-[600px] lg:max-w-[800px]">
            <Chessboard options={chessboardOptions} />
        </div>
    )
}

export default ChessBoard;