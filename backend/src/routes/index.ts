import { Router } from 'express'
import type { Response, Request, NextFunction } from 'express'
import { rateLimit } from '../middleware/rateLimit'
import { body, check, validationResult } from 'express-validator'
import { sendEmailForm } from '../controllers/email'

import {
  getUsers,
  getUser,
  addUser,
  updateUser,
  deleteUser,
  loginUser,
  registerUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  resetPasswordToken,
  verifyEmailToken,
  verifyToken,
  generateToken,
  verifyTokenMiddleware,
  findUserByUsername,
  checkIfAdmin,
  checkIfManagement,
  authenticateUser,
  getPublicUserNamesByIds,
  //verificationSuccess,
  requestNewToken,
  refreshExpiredToken,
  comparePassword,
  updateUsername,
  resetUsernameChange,
  confirmEmail,
  addToBlacklistedJokes,
  removeJokeFromBlacklisted,
  revokeUserSessions,
  authPing,
} from '../controllers/auth'
import { ELanguage, ELanguages } from '../types'
import { EPleaseProvideAValidEmailAddress } from '../controllers/email'
import {
  getColorAccessibility,
  saveColorAccessibility,
  getAllColorPalettesByUser,
  getColorPaletteByUser,
  saveColorPaletteByUser,
  deleteColorPaletteByUser,
} from '../controllers/colors'
import { mongoIsConnected, mongoLastError } from '../db'

const router = Router()

const rateLimitMessage = 'Too many requests, please try again later.'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: rateLimitMessage,
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: rateLimitMessage,
})

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: rateLimitMessage,
})

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: rateLimitMessage,
})

const tokenIssueLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: rateLimitMessage,
})

router.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    ok: true,
    mongoConnected: mongoIsConnected(),
    mongoLastError: mongoLastError(),
  })
})

router.post('/login', loginLimiter, loginUser)

router.get('/auth/ping', [authenticateUser], authPing)

router.post('/users/forgot', forgotPasswordLimiter, forgotPassword)
router.get('/users/reset/:token', resetPassword)
router.post('/users/reset/:token', resetPasswordLimiter, resetPasswordToken)
router.get('/users/reset-username/:token', resetUsernameChange)

// Public, non-admin endpoint for displaying authors (returns only {_id, name})
router.post('/users/public/names', getPublicUserNamesByIds)

router.get('/users', [authenticateUser, checkIfAdmin], getUsers)
router.get('/users/:id', [authenticateUser], getUser)
//router.post('/users', addUser)
router.put('/users/:id', [authenticateUser, comparePassword, updateUser])
router.put('/users/', [authenticateUser, comparePassword, updateUsername])
router.get('/users/:username/confirm-email/:token', confirmEmail)
router.delete('/users/:id/:deleteJokes', [authenticateUser, deleteUser])
router.post('/users/register', registerLimiter, registerUser)
router.get('/users/verify/:token', verifyEmailToken)
router.get('/users/logout', logoutUser)
//router.get('/users/verify/:token', [verifyTokenMiddleware, verifyEmailToken])
router.post('/users/:id', tokenIssueLimiter, generateToken)
router.get('/users/username/:username', findUserByUsername)
router.post(
  '/users/:id/revoke-sessions',
  [authenticateUser],
  revokeUserSessions
)
// router.post('/users/:id/delete', deleteAllJokesByUserId)
router.put(
  '/users/:id/:jokeId/:language',
  [authenticateUser],
  addToBlacklistedJokes
)
router.delete(
  '/users/:id/:joke_id/:language',
  [authenticateUser],
  removeJokeFromBlacklisted
)

// Color Accessibility tool (per-user storage)
router.get('/colors/accessibility', [authenticateUser], getColorAccessibility)
router.put('/colors/accessibility', [authenticateUser], saveColorAccessibility)

// Color Accessibility named palettes (Blob-style versions)
router.get(
  '/colors/:user/palettes',
  [authenticateUser],
  getAllColorPalettesByUser
)
router.get(
  '/colors/:user/palettes/:versionName',
  [authenticateUser],
  getColorPaletteByUser
)
router.post(
  '/colors/:user/palettes/:versionName',
  [authenticateUser],
  saveColorPaletteByUser
)
router.delete(
  '/colors/:user/palettes/:versionName',
  [authenticateUser],
  deleteColorPaletteByUser
)

router.get('/', (_req: Request, res: Response): void => {
  res.send('Nothing to see here')
})

router.post(
  '/send-email-form',
  [
    body('firstName').trim().escape(),
    body('lastName').trim().escape(),
    body('email').isEmail(),
    body('message').trim().escape(),
    body('encouragement').trim().escape(),
    body('color').trim().escape(),
    body('dark').trim().escape(),
    body('light').trim().escape(),
    body('select').trim().escape(),
    body('selectmulti').trim().escape(),
  ],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().join('\n'),
        errors: errors.array(),
      })
    }
    next()
  },
  sendEmailForm
)

export default router
