/**
 * 积分退款幂等逻辑测试脚本
 * 运行: node scripts/test-credit-refund.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kzdjqqinkonqlclbwleh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function getBalance(userId) {
  const { data, error } = await supabase.from('profiles').select('credits').eq('id', userId).single()
  if (error) throw new Error(`getBalance failed: ${error.message}`)
  return Number(data.credits)
}

function pass(msg) { console.log(`  ✓ ${msg}`) }
function fail(msg) { console.error(`  ✗ ${msg}`); process.exitCode = 1 }
function check(cond, msg) { cond ? pass(msg) : fail(msg) }

async function main() {
  // 获取第一个用户作为测试对象
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1 })
  if (usersError || !users?.length) { console.error('No users found:', usersError); process.exit(1) }

  const user = users[0]
  console.log(`\nTest user: ${user.email} (${user.id})`)

  const initial = await getBalance(user.id)
  console.log(`Initial balance: ${initial}`)
  if (initial < 0.05) { console.error('Need at least 0.05 credits to run tests'); process.exit(1) }

  // ─── Test 1: begin + finalize(false) → 退款 ───────────────────────────────
  console.log('\n[Test 1] begin + finalize(false) → should refund')
  const op1 = crypto.randomUUID()

  const { data: b1, error: be1 } = await supabase.rpc('begin_credit_operation', {
    p_user_id: user.id, p_operation_id: op1, p_feature_code: 'test_refund',
    p_amount: 0.01, p_description: 'test',
  })
  check(!be1 && b1?.success, `begin succeeded: ${JSON.stringify(b1)} ${be1?.message || ''}`)

  const afterDeduct = await getBalance(user.id)
  check(Math.abs(afterDeduct - (initial - 0.01)) < 0.001, `balance deducted: ${afterDeduct} (expected ${initial - 0.01})`)

  const { data: f1, error: fe1 } = await supabase.rpc('finalize_credit_operation', {
    p_user_id: user.id, p_operation_id: op1, p_feature_code: 'test_refund',
    p_success: false, p_error_message: 'simulated failure',
  })
  check(!fe1 && f1?.status === 'refunded', `finalize(false) → refunded: ${JSON.stringify(f1)} ${fe1?.message || ''}`)

  const afterRefund = await getBalance(user.id)
  check(Math.abs(afterRefund - initial) < 0.001, `balance restored: ${afterRefund} (expected ${initial})`)

  // ─── Test 2: begin + finalize(true) → 扣费成功 ────────────────────────────
  console.log('\n[Test 2] begin + finalize(true) → should charge')
  const op2 = crypto.randomUUID()

  const { data: b2, error: be2 } = await supabase.rpc('begin_credit_operation', {
    p_user_id: user.id, p_operation_id: op2, p_feature_code: 'test_success',
    p_amount: 0.01, p_description: 'test',
  })
  check(!be2 && b2?.success, `begin succeeded: ${JSON.stringify(b2)} ${be2?.message || ''}`)

  const { data: f2, error: fe2 } = await supabase.rpc('finalize_credit_operation', {
    p_user_id: user.id, p_operation_id: op2, p_feature_code: 'test_success',
    p_success: true,
  })
  check(!fe2 && f2?.status === 'succeeded', `finalize(true) → succeeded: ${JSON.stringify(f2)} ${fe2?.message || ''}`)

  const afterSuccess = await getBalance(user.id)
  check(Math.abs(afterSuccess - (initial - 0.01)) < 0.001, `balance charged: ${afterSuccess} (expected ${initial - 0.01})`)

  // ─── Test 3: 幂等 - 同一 operation_id 不重复扣费 ──────────────────────────
  console.log('\n[Test 3] Idempotency - same operation_id should not double-charge')
  const op3 = crypto.randomUUID()

  await supabase.rpc('begin_credit_operation', {
    p_user_id: user.id, p_operation_id: op3, p_feature_code: 'test_idempotent',
    p_amount: 0.01, p_description: 'test',
  })
  const { data: b3b } = await supabase.rpc('begin_credit_operation', {
    p_user_id: user.id, p_operation_id: op3, p_feature_code: 'test_idempotent',
    p_amount: 0.01, p_description: 'test',
  })
  check(b3b?.already_exists === true, `second call returns already_exists: ${JSON.stringify(b3b)}`)

  const afterIdempotent = await getBalance(user.id)
  check(Math.abs(afterIdempotent - (afterSuccess - 0.01)) < 0.001, `only deducted once: ${afterIdempotent}`)

  // cleanup
  await supabase.rpc('finalize_credit_operation', {
    p_user_id: user.id, p_operation_id: op3, p_feature_code: 'test_idempotent',
    p_success: false, p_error_message: 'cleanup',
  })

  // ─── 汇总 ─────────────────────────────────────────────────────────────────
  const finalBalance = await getBalance(user.id)
  console.log(`\nFinal balance: ${finalBalance} (net change: ${(finalBalance - initial).toFixed(2)}, expected: -0.01 from Test 2)`)
  console.log(process.exitCode ? '\n✗ Some tests FAILED' : '\n✓ All tests PASSED')
}

main().catch(err => { console.error(err); process.exit(1) })
