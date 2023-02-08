// Publish the package in the CWD with an OTP code from CFA
import { getOtp } from '@continuous-auth/client'
import { spawnSync } from 'child_process'

async function publish () {
  spawnSync('npm', ['publish', '--otp', await getOtp()])
}

publish()
