// HowTo.tsx
import React from 'react';
import { Modal } from '../modal/Modal';
import './HowTo.css';

interface HowToProps {
   isOpen: boolean;
   onClose: () => void;
}

export const HowTo: React.FC<HowToProps> = ({
   isOpen,
   onClose
}) => {
   return (
       <Modal isOpen={isOpen} onClose={onClose}>
           <div className="how-to">
               <h2>How to Play Up-N-Down</h2>

               <div className="how-to-section">
                   <h3>Game Overview</h3>
                   <p>Up-N-Down is a cooperative card game where players strategically play cards on ascending and descending foundation piles. The goal is to play all cards from all players hands successfully. All players win or lose together.</p>
                   <p>You are not allowed to tell other players what cards you have in your hand</p>
               </div>

               <div className="how-to-section">
                   <h3>Mechanics</h3>
                   <p>Click on a card in your hand.  Click on a foundation pile to play the selected card</p>
                   <p>Undo Last Play - if enabled in settings, allows you to undo only the last card played</p>
                   <p>End Turn - in Multiplayer only, allows you to end your turn when you play at least 2 cards (or 1 when the draw pile has been depleted)</p>
               </div>

               <div className="how-to-section">
                   <h3>Foundation Piles</h3>
                   <ul>
                       <li>Two ascending piles (starting at 1)</li>
                       <li>Two descending piles (starting at 100)</li>
                       <li>Only play higher cards on (green) ascending piles</li>
                       <li>Only play lower cards on (red) descending piles</li>
                       <li>Special moves: Play a card exactly 10 higher/lower than current value in the opposite direction of the flow</li>
                        <li>On the gameboard between the foundation pile and the players hand is the counter of cards remaining in the draw pile</li>
                   </ul>
               </div>

               <div className="how-to-section">
                   <h3>Solitaire Mode</h3>
                   <ul>
                       <li>Start with 8 cards</li>
                       <li>Continuous playuntil draw pile depleted</li>
                       <li>Draw replacement cards immediately after each play</li>
                       <li>Game ends when:
                           <ul>
                               <li>Win: Play all cards from hand and draw pile</li>
                               <li>Lose: No valid moves available</li>
                           </ul>
                       </li>
                   </ul>
               </div>

               <div className="how-to-section">
                  <h3>Multiplayer Mode (2-8 players)</h3>
                  <ul>
                     <li>Start with 6 cards each (7 for two players)</li>
                     <li>Must play a minimum of 2 cards per turn until draw pile depleted</li>
                     <li>When the draw pile is empty, a minimum of 1 card must be played</li>
                     <li>Skip players with empty hands</li>
                     <li>
                        Game ends when:
                        <ul>
                           <li>Win: All players play all their cards</li>
                           <li>Lose: Current player has no valid moves</li>
                        </ul>
                     </li>
                  </ul>
      
                  <h4>Like/Love/Really Love Communications</h4>
                  <ul>
                     <li>If you have a good play on a foundation pile and it is not your turn, you can communicate to the other players your interest</li>
                     <li>Above and below each foundation pile are two sets of 3 icons that correspond to each player. The 3 icons on top of the card represent players 1, 2 and 3.  The 3 on the bottom of the card represent players 4, 5 and 6.</li>
                     <li>You can click on the # corresponding to your player to express interest (this tells the other players to attempt to avoid playing on the pile)</li>
                     <li>

                        Icon interactions:
                        <ul>
                           <li>First click - a thumbs up icon - you like this pile</li>
                           <li>Second click - an empty heart - you love this pile</li>
                           <li>Third click - a full heart - you really love this pile</li>
                           <li>Fourth click - empty - resets your interest to none</li>
                        </ul>
                     <li>When you start your turn, your like indicators are reset</li>
                     </li>
                  </ul>
               </div>
      

               <div className="how-to-section">
                   <h3>Settings</h3>
                   <ul>
                       <li>Card Range (smaller range makes game easier to win):
                           <ul>
                               <li>Minimum (2-72): Sets lowest card value</li>
                               <li>Maximum (19-99): Must be 12+ higher than minimum</li>
                           </ul>
                       </li>
                       <li>Hand Sizes (larger hand size makes game easier to win):
                           <ul>
                               <li>Solitaire (2-12 cards)</li>
                               <li>Two Player (2-10 cards)</li>
                               <li>Multiplayer (2-8 cards)</li>
                           </ul>
                       </li>
                       <li>Refresh Cards on Play (Multiplayer only) (Immediate draw makes game easier to win):
                           <ul>
                               <li>On: Draw replacement cards immediately</li>
                               <li>Off: Draw replacement cards when ending turn</li>
                           </ul>
                       </li>
                   </ul>
               </div>

            
           </div>
       </Modal>
   );
};