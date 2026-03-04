/**
 * 更新 Supabase Storage Bucket 配置
 * 将 user-uploads bucket 的大小限制更新为 500MB
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kzdjqqinkonqlclbwleh.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('错误: 需要设置 SUPABASE_SERVICE_ROLE_KEY 环境变量')
  process.exit(1)
}

async function updateBucketConfig() {
  try {
    // 1. 获取当前配置
    console.log('正在获取当前 bucket 配置...')
    const getResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/user-uploads`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!getResponse.ok) {
      throw new Error(`获取配置失败: ${getResponse.status} ${await getResponse.text()}`)
    }

    const currentConfig = await getResponse.json()
    console.log('当前配置:', JSON.stringify(currentConfig, null, 2))

    // 2. 更新配置
    console.log('\n正在更新 bucket 配置...')
    const updateResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/user-uploads`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public: true,
        file_size_limit: 524288000, // 500MB
        allowed_mime_types: [
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'image/jpeg',
          'image/png'
        ],
      }),
    })

    if (!updateResponse.ok) {
      throw new Error(`更新配置失败: ${updateResponse.status} ${await updateResponse.text()}`)
    }

    const updatedConfig = await updateResponse.json()
    console.log('更新后配置:', JSON.stringify(updatedConfig, null, 2))

    // 3. 验证更新
    console.log('\n正在验证更新...')
    const verifyResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket/user-uploads`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const verifiedConfig = await verifyResponse.json()
    console.log('验证配置:', JSON.stringify(verifiedConfig, null, 2))

    if (verifiedConfig.file_size_limit === 524288000) {
      console.log('\n✅ 成功！Bucket 大小限制已更新为 500MB (524288000 bytes)')
    } else {
      console.log('\n⚠️  警告：配置可能未正确更新')
    }
  } catch (error) {
    console.error('错误:', error.message)
    process.exit(1)
  }
}

updateBucketConfig()
