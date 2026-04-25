import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">
        欢迎使用美容美发预约系统
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <Link 
          href="/booking" 
          className="bg-blue-500 hover:bg-blue-600 text-white p-8 rounded-lg text-center transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-4">在线预约</h2>
          <p className="text-blue-100">
            选择日期和技师，查看可用时间段进行预约
          </p>
        </Link>
        
        <Link 
          href="/my-appointments" 
          className="bg-green-500 hover:bg-green-600 text-white p-8 rounded-lg text-center transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-4">我的预约</h2>
          <p className="text-green-100">
            输入手机号查询和取消您的预约记录
          </p>
        </Link>
        
        <Link 
          href="/admin" 
          className="bg-purple-500 hover:bg-purple-600 text-white p-8 rounded-lg text-center transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-4">管理后台</h2>
          <p className="text-purple-100">
            管理技师排班、查看和处理预约订单
          </p>
        </Link>
      </div>

      <div className="mt-12 text-gray-600 text-center">
        <p className="text-lg mb-4">系统特点：</p>
        <ul className="list-disc list-inside space-y-2">
          <li>灵活的排班管理，支持设置多个工作时间段</li>
          <li>每个时间段按30分钟切割成可预约的slot</li>
          <li>同一时间段同一技师最多接3个预约</li>
          <li>用户可凭手机号查询和取消预约</li>
          <li>预约前2小时内无法取消预约</li>
        </ul>
      </div>
    </div>
  )
}
