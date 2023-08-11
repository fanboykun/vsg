## Bug List

- did not fetch the conversation after logged in (but fetch after register)
- did not found a user public key (gun user pub) if the user that searched registered first (but work with the user that being registered first) 
- the ui list of conversation did not change after new message sent (should be changed after new message sent because the updated at value of the conversation updated)
- when the 3rd user registered and make some conversation, sometimes the messages list duplicate on one user
- the conversation list and messages list did not destroyed when a user logout and loggedin/registered with the same browser
- 