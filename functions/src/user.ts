import * as admin from 'firebase-admin';
import { User, ContactMethod, ContactMethodInput, Location, LocationInput } from './generated/graphql';

export class UserService {
  constructor(
    private db: admin.firestore.Firestore,
  ) {
  }

/*
  async createLobby(player: Player): Promise<Lobby> {
    let players: Player[] = [player];
    // drawCard for everyone.
    const rv: Lobby = {
      //  playerInGames
      id: (this.lobbyId++).toString(),
      playerInLobby: players
    };
    //console.log(rv)
    this.activeLobbies.push(rv);
    return rv;
  }
*/

}
