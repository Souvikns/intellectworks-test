/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
// import * as functions from 'firebase-functions'
import * as admin from "firebase-admin";
// import * as logger from "firebase-functions/logger";
// import { initializeApp } from '@firebase/app'
// import { getAuth } from "@firebase/auth";
import { getFirestore, Timestamp, } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'


const app = admin.initializeApp({
  credential: admin.credential.applicationDefault()
})

const auth = getAuth(app)
const db = getFirestore()

export const authenticateRequest = async (req: any, res: any, next: Function) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).send("Unautorized: No Token Provided");
    return;
  }
  const idToken = authHeader.split("Bearer ")[1]
  try {
    const decodedToken: any = jwt.decode(idToken)
    next(decodedToken.uid)
  } catch (error) {
    res.status(401).send('Unautorized: Invalid token')
  }
}

export const signup = onRequest(async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    res.status(400).send('Missing Fields')
    return
  }

  try {

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await auth.createUser({
      email,
      password: hashedPassword,
      displayName: name
    })


    await db.collection('users').doc(user.uid).set({ name, createdAt: Timestamp.now()})

    const token = await auth.createCustomToken(user.uid)

    res.status(201).json({ token })
  } catch (error) {
    res.status(500).send(error)
  }
})

export const login = onRequest(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).send('Missing Fields')
    return
  }
  try {
    const userRecord = await auth.getUserByEmail(email)
    if (!userRecord.passwordHash) {
      res.send('No Password Found')
      return
    }

    const isPasswordValid = await bcrypt.compare(password, getPassword(userRecord.passwordHash))

    if (!isPasswordValid) {
      res.status(400).send('Password Not Valid')
      return
    }

    const token = await auth.createCustomToken(userRecord.uid)

    res.status(200).json({ token })
  } catch (error) {
    res.status(500).send(error)
  }
})

export const saveNotes = onRequest(async (req, res) => {
  await authenticateRequest(req, res, async (uid: string) => {
    const { title, content } = req.body
    if (!title || !content) {
      res.status(400).send('Missing Fields!')
      return
    }
    try {
      await db.collection('notes').add({
        user_uid: uid,
        title,
        content,
        createdAt: Timestamp.now()
      })
      res.status(201).send('Notes Saved')
    } catch (error) {
      res.status(500).send('Could not save notes')
    }
  })
})

export const geNotes = onRequest(async (req, res) => {
  await authenticateRequest(req, res, async (uid: string) => {
    try {

      const notesRef = await db.collection('notes').where('user_uid', '==', uid).get()
      if (notesRef.empty) {
        res.status(400).send('No Notes Saved yet!')
        return
      }
      const resp: any = []
      notesRef.forEach((doc) => {
        resp.push(doc.data())
      })
      res.status(200).json(resp)
    } catch (error) {
      res.status(400).send('Could not find notes')
    }
  })

})

export const updateUser = onRequest(async (req, res) => {
  await authenticateRequest(req, res, async (uid: string) => {
    let { name, email, password } = req.body

    const user = await auth.getUser(uid)
    name = name || user.displayName
    email = email || user.email
    password = password || getPassword(user.passwordHash as string)

    try {

      await auth.updateUser(uid, {
        email,
        displayName: name,
        password
      })

      await db.collection('users').doc(uid).update({
        name
      })

      res.status(200).send("User Updated!")
    } catch (error) {
      res.status(500).send(error)
    }

  })
})

const getPassword = (passwordHash: string) => {
  return passwordHash.split(':')[2].split('=')[1]
}