/**
 * 视频分析报告导出工具
 * 支持导出为 PNG 图片和 PDF 文档
 * 移动端优化：Web Share API + 图片质量压缩
 */

import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

/**
 * 检测是否为移动设备
 */
function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

/**
 * 等待图表渲染完成
 */
async function waitForChartsToRender(): Promise<void> {
  return new Promise((resolve) => {
    // 等待 500ms 确保 Recharts 图表完全渲染
    setTimeout(resolve, 500)
  })
}

/**
 * 导出报告为 PNG 图片
 * @param elementId 要导出的元素 ID
 * @param filename 文件名（不含扩展名）
 */
export async function exportReportAsPNG(
  elementId: string = 'video-analysis-report',
  filename: string = `视频分析报告-${Date.now()}`
): Promise<void> {
  const element = document.getElementById(elementId)

  if (!element) {
    throw new Error('找不到报告元素')
  }

  const isMobile = isMobileDevice()

  // 等待图表渲染
  await waitForChartsToRender()

  const options = {
    quality: isMobile ? 0.8 : 0.95,
    pixelRatio: isMobile ? 1.5 : 2,
    backgroundColor: '#0a0a0a', // 深色背景
    cacheBust: true,
  }

  try {
    const dataUrl = await toPng(element, options)

    // 移动端：优先使用 Web Share API
    if (isMobile && navigator.share && navigator.canShare) {
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `${filename}.png`, { type: 'image/png' })

      const shareData = { files: [file] }
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData)
        toast.success('分享成功')
        return
      }
    }

    // 桌面端或不支持 Share API：直接下载
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('导出成功')
  } catch (error) {
    console.error('PNG 导出失败:', error)
    if (error instanceof Error && error.message.includes('canvas')) {
      toast.error('图片过大，建议使用 PDF 格式导出')
    } else {
      toast.error('导出失败，请重试')
    }
    throw error
  }
}

/**
 * 导出报告为 PDF 文档（自动分页）
 * @param elementId 要导出的元素 ID
 * @param filename 文件名（不含扩展名）
 */
export async function exportReportAsPDF(
  elementId: string = 'video-analysis-report',
  filename: string = `视频分析报告-${Date.now()}`
): Promise<void> {
  const element = document.getElementById(elementId)

  if (!element) {
    throw new Error('找不到报告元素')
  }

  const isMobile = isMobileDevice()

  // 等待图表渲染
  await waitForChartsToRender()

  const options = {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#0a0a0a',
    cacheBust: true,
  }

  try {
    // 先将整个报告转为图片
    const dataUrl = await toPng(element, options)

    // 创建临时图片以获取尺寸
    const img = new Image()
    img.src = dataUrl

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })

    // A4 纸张尺寸（210mm x 297mm）
    const pdfWidth = 210
    const pdfHeight = 297

    // 计算图片在 PDF 中的尺寸
    const imgWidth = pdfWidth
    const imgHeight = (img.height * pdfWidth) / img.width

    // 创建 PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // 如果图片高度超过一页，需要分页
    if (imgHeight > pdfHeight) {
      let heightLeft = imgHeight
      let position = 0

      // 第一页
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight

      // 后续页
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }
    } else {
      // 单页
      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight)
    }

    // 保存 PDF
    pdf.save(`${filename}.pdf`)

    toast.success('PDF 导出成功')
  } catch (error) {
    console.error('PDF 导出失败:', error)
    toast.error('PDF 导出失败，请重试')
    throw error
  }
}
