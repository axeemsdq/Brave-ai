# Bravo AI — private chat

A mobile-friendly private chat with a separate Admin login. The interface is AI-themed, but it clearly tells the guest that replies are personally sent by the account owner.

## Run locally
1. Install Node.js 18 or newer.
2. In this folder run `npm install`.
3. Set environment variables:
   - `ADMIN_PASSWORD`: your private admin password
   - `CHAT_PASSWORD`: the password you share with your girlfriend
   - `SESSION_SECRET`: a long random secret (at least 32 characters)
4. Run `npm start` and open `http://localhost:3000`.

## Deploy from a phone with Render
1. Create a GitHub account and a new repository.
2. Upload the files in this folder, keeping `server.js`, `package.json`, `render.yaml`, and the `public` folder at the repository root.
3. In Render, create a new Blueprint and connect that GitHub repository.
4. Set `ADMIN_PASSWORD` and `CHAT_PASSWORD` as private environment variables. Use two different strong passwords. Render generates `SESSION_SECRET`.
5. Deploy. Share the public site URL and the guest password. Keep the Admin password private; open the same URL and choose **Admin** to reply.

## Important limitations
- This starter stores the latest 500 messages in server memory. They disappear if the server restarts or sleeps; this is a starter/demo, not durable message storage.
- Free hosting may sleep when inactive, so instant delivery is not guaranteed until the server wakes.
- Use HTTPS hosting only. Do not share the admin password.
- The guest screen explains that a person sends the replies, rather than claiming the messages are AI-generated.
