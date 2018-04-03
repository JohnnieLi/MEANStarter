# Angular5 + Node Starter

This Angular5 project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.6.5.

## Structure
  .                  
    ├── ...                                             
    ├── ATBI     <== frontEnd folder                                                        
    │   ├── src   
    │   ├── dist                         
    │   ├── node_modules             
    │   ├── e2e                      
    │   └── ...               
    ├── models          <== backend folder                 
    │   ├── Test.ts                                  
    │   └── ...                
    ├── controllers     <== backend folder                                 
    │   ├── tests.ts            
    │   └── ...                     
    ├── server.js       <== backend file                    
    ├── api.js          <== backend file                               
    ├── node_modules     <== backend modules                                    
    └── ...                                            

Combine Front-end side (Angular5) with Back-end server(Node.js+ express).


##Development server

###1.server side: 

Location: root folder

Run `npm install` before you start it, all files will be stalled in node_modules and you can find them in package.json

Run `node server.js` to start server, listen 3000 port. `http://localhost:3000`

### 2.Front_end side

Location: .\ATBI

Run `npm install` before you start it, all files will be stalled in node_modules and you can find them in package.json `.\ATBI\package.json`

Run `ng serve` to start Angular5, listen 4200 port. `http://localhost:4200`

### 3.Front2back 

Location: .\ATBI

Run `npm start` to a, build Angular5 to `ATBI\dist` and b, run server with port 3000 . `http://localhost:3000`, 
Then we can access front-end part through back-end server.


