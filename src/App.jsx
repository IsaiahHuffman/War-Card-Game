import { useState } from 'react';
import 'semantic-ui-css/semantic.min.css';
import {
  Label,
  Card,
  CardGroup,
  Segment,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  Button,
} from 'semantic-ui-react';

function App() {
  const [deckID, setDeckID] = useState('');                     //deck ID
  const [cardsRemaining, setCardsRemaining] = useState(0);      //how many cards remaining
  const [drawsPlayed, setDrawsPlayed] = useState(0);            //how many times we've drawn from the deck
  const [tiesOccurred, setTiesOccurred] = useState(0);          //how many ties have occurred
  const [cards, setCards] = useState([]);                       //card holder
  const [player1Score, setPlayer1Score] = useState(0);          //Player 1's Score
  const [player2Score, setPlayer2Score] = useState(0);          //Player 2's Score
  const [gameHistory, setGameHistory] = useState([]);           //Holds previous game scores


  //Handles coloring the cards and displaying each player's score after the round
  function Player({ name, card, score, winState }) {
    let color = 'lightgrey';
    if (winState === 'Player 1 Vic') {
      color = name === 'Player 1' ? 'green' : 'lightgrey';
    } else if (winState === 'Player 2 Vic') {
      color = name === 'Player 2' ? 'green' : 'lightgrey';
    } else if (winState === 'Tie') {
      color = 'yellow';
    }
    return (
      <Card style={{ backgroundColor: color }}>
        <Card.Content>
        { /* You can put comments in here too... */ }
        { /* You will want to tweak these a bit for Assignment #4 */ }
          <div className="ui center aligned header">{name}</div>
        </Card.Content>
        <img src={card} alt="Card" />
        <Card.Content>
          <div className="ui center aligned header">Score: {score}</div>
        </Card.Content>
      </Card>
    )
  }

  //Pulls a new deck from the API
  async function newDeck() {
    const deckResponse = await fetch('https://cards.soward.net/deck/newDeck');
    if (!deckResponse.ok) {
      alert('Error fetching new deck: ' + deckResponse.error);
      return;
    }
    let deckJson = '';
    try {
      deckJson = await deckResponse.json();
    } catch (error) {
      alert(`Error fetching Deck: ${error}<br>${deckResponse.body}`);
      return;
    }
    if (deckJson.success !== true) {
      alert(`Error fetching Deck. Status: ${deckJson.status} Message: ${deckJson.message}`);
      return;
    }

    //reset board appropriately
    setDeckID(deckJson.deckID);
    setCardsRemaining(deckJson.cardsRemaining);
    setPlayer1Score(0);
    setPlayer2Score(0);


    setDeckID(deckJson.deckID);
    localStorage.setItem("cardsApiDeckID", JSON.stringify(deckJson.deckID));
    // We could rely on useEffect here, but we can save an API call by setting it directly.
    setCardsRemaining(deckJson.cardsRemaining);

    //if we've played at least one hand and you ask to get a new deck, then print the game results
    if ((deckID != "") && ((player1Score != 0) || (player2Score != 0))) {    
      historyMatters();
    }


  }

  //forms the base table with which historyMatters actually appends previou game results to
  function formHistoryTable() {
    return (
      <Segment inverted color="black">
      <Table celled inverted>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Deck ID</Table.HeaderCell>
            <Table.HeaderCell>Player 1</Table.HeaderCell>
            <Table.HeaderCell>Player 2</Table.HeaderCell>
            <Table.HeaderCell>Ties Occurred</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {gameHistory.map((row, index) => (
            <Table.Row key={index}>
              {row.map((cell, cellIndex) => (
                <Table.Cell key={cellIndex}>{cell}</Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      </Segment>
    );
  };
  

  //append new games results to the game history
  //name is in reference to my favorite Youtuber
  //Don't laugh. It's my code and I'll name my functions what I want.
  function historyMatters(){

    setGameHistory([...gameHistory, [deckID, player1Score, player2Score, tiesOccurred], ]);
  }


   //Shuffles the cards
   async function shuffleCards() {
    if (deckID === '') {
      alert('Please get a new deck first');
      return;
    }
    
    const deckResponse = await fetch(`https://cards.soward.net/deck/shuffleDeck/${deckID}`);
    if (!deckResponse.ok) {
      throw new Error(deckResponse.error);
    }
  
    const cardsJson = await deckResponse.json();
    if (cardsJson.success === false) {
      alert(`Error drawing Cards. Status: ${cardsJson.message}`);
      return;
    }

    //if we've played at least one hand and you ask to get a new deck, then print the game results
    if ((deckID != "") && ((player1Score != 0) || (player2Score != 0))) {    
      historyMatters();
    }


    //reset the board, except the deckID which we keep
    setCardsRemaining(52);
    setTiesOccurred(0);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setDrawsPlayed(0);



  }


  //Draws the cards
  async function drawCards() {
    if (deckID === '') {
      alert('Please get a new deck first');
      return;
    }
  
    const deckResponse = await fetch(`https://cards.soward.net/deck/drawFromDeck/${deckID}/2`);
    if (!deckResponse.ok) {
      throw new Error(deckResponse.error);
    }
  
    const cardsJson = await deckResponse.json();
    if (cardsJson.success === false) {
      alert(`Error drawing Cards. Status: ${cardsJson.message}`);
      return;
    }

    //display the respective card image
    const [player1Card, player2Card] = cardsJson.cards;
    setCards([player1Card, player2Card]);

     //API Check
     const deckStatus = await fetch(`https://cards.soward.net/deck/deckStatus/` + deckID)
     if (!deckStatus.ok) {
       throw new Error(deckResponse.error);
     }
 
    //wait to hear about deck status
     const deckJson = await deckStatus.json();
 
     console.log(cardsJson)
     setCardsRemaining(deckJson.cardsRemaining)

     //Increment how many times we've drawn from the deck
     setDrawsPlayed(drawsPlayed + 1)
    //detetermine who won
    determineWinner(player1Card.intValue, player2Card.intValue);
  }

  
  ///Determines who wins a hand. Note the similar logic to winState at the bottom. See comments there for more info
  function determineWinner(player1CardValue, player2CardValue) {
    let result;
    if (player1CardValue > player2CardValue) {
      setPlayer1Score(player1Score + 1);
      result = 'Player 1 Vic';
    } else if (player1CardValue < player2CardValue) {
      setPlayer2Score(player2Score + 1);
      result = 'Player 2 Vic';
    } else {
      setTiesOccurred(tiesOccurred + 1);
      result = 'Tie';
    }
  }
  

  //Delete the deck when the top button is pressed
  async function deleteDeck() {
    const deckResponse = await fetch('https://cards.soward.net/deck/deleteDeck/' + deckID, { method: 'DELETE' });
    if (!deckResponse.ok) {
      alert('Error deleting deck: ' + deckResponse.error);
      return;
    }

    //reset the board appropriately
    setDeckID("");
    setCardsRemaining(0);
    setTiesOccurred(0);
    setPlayer1Score(0);
    setPlayer2Score(0);
    setDrawsPlayed(0);

     //if we've played at least one hand and you ask to get a new deck, then print the game results
     if ((deckID != "") && ((player1Score != 0) || (player2Score != 0))) {    
      historyMatters();
    }


    //Attempt to get the blue and red card backs to display, TODO if I ever come back to this.
    /*
    const fetchPlayer1Card = await fetch(`https://cards.soward.net/deck/drawFromDeck/${deckID}>/<count> `);
    const fetchPlayer2Card = await fetch(`https:\/\/cards.soward.net\/images/backs\/red2.svg`);
  
    if (!fetchPlayer1Card.ok || !fetchPlayer2Card.ok) {
      throw new Error('Failed to fetch cards');
    }
    alert(fetchPlayer1Card.card);
    alert(fetchPlayer2Card.card);
    const player1Card = fetchPlayer1Card.json();
    const player2Card = fetchPlayer2Card.json();
  
    setCards([player1Card, player2Card]);
    */

  }
 
  //Display the top of the screen info
  function DeckInfo() {
    return (
      <Segment inverted color="black">
        <Table celled inverted>
          <TableHeader>
            <TableRow>
              <TableHeaderCell colSpan="4">Deck Stats</TableHeaderCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>Deck ID</TableHeaderCell>
              <TableHeaderCell>Cards Remaining</TableHeaderCell>
              <TableHeaderCell>Draws Played</TableHeaderCell>
              <TableHeaderCell>Ties Occurred</TableHeaderCell>
            </TableRow>
            <TableRow>
              <TableCell>{deckID}</TableCell>
              <TableCell>{cardsRemaining}</TableCell>
              <TableCell>{drawsPlayed}</TableCell>
              <TableCell>{tiesOccurred}</TableCell>
            </TableRow>
          </TableHeader>
        </Table>
      </Segment>
    );
  }

  

  return (
    <>
    {/* Display the buttons at the top */}
      <Segment>
        <DeckInfo/>
      </Segment>
      <Segment align="left">
        <Label attached="top" align="left">
          Controls
        </Label>
        <Button onClick={drawCards} disabled={cardsRemaining === 0}> Draw </Button>
        <Button onClick={newDeck}> New Deck </Button>
        <Button onClick={shuffleCards} disabled={deckID == ''}> Shuffle </Button>
        <Button onClick={deleteDeck} disabled={deckID == ''}> Delete Deck </Button>
      </Segment>
      <CardGroup centered>

      {/* This nonsense is the logic that calls Player(...) and gets the cards to display */}
      {/* You may wonder, why would I have the winState logic be displayed here and in its own function?*/}
      {/* That is because when I try to combine their logics, my code bricks. So I'm just going to leave it. I've suffered too much from this*/}
      {cards.length > 0 ? (
        cards.map((card, index) => (
          <Player
            key={index}
            name={`Player ${index + 1}`}
            card={card.svgImage}
            score={index === 0 ? player1Score : player2Score}
            winState={
              index === 0
                ? card.intValue > cards[1].intValue
                  ? 'Player 1 Vic'
                  : card.intValue < cards[1].intValue
                  ? 'Player 2 Vic'
                  : 'Tie'
                : card.intValue > cards[0].intValue
                ? 'Player 2 Vic'
                : card.intValue < cards[0].intValue
                ? 'Player 1 Vic'
                : 'Tie'
            }
          />
        ))
      ) : (
        <Segment>Nothing to see here.</Segment>
      )}
    </CardGroup>
      
      {/* Form the game history table at the bottom */}
      {formHistoryTable()}




    </>
  );
}

export default App;