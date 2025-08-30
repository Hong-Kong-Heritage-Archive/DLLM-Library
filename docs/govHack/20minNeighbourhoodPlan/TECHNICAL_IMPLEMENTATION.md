# 🛠️ 20-Minute Neighbourhood Plan - 技術實現指南

## 🏗️ **系統架構設計**

### **整體架構**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │   後端 API      │    │   數據層        │
│                 │    │                 │    │                 │
│ • 互動式地圖   │◄──►│ • 數據處理      │◄──►│ • 政府開放數據  │
│ • 儀表板       │    │ • 分析引擎      │    │ • 地理空間數據  │
│ • 社區工具     │    │ • 模擬模型      │    │ • 分析結果      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **技術棧選擇**

#### **前端技術**
- **框架**: React.js + TypeScript
- **地圖庫**: Leaflet.js + React-Leaflet
- **可視化**: D3.js + Chart.js
- **UI 組件**: Material-UI 或 Ant Design
- **狀態管理**: Redux Toolkit 或 Zustand

#### **後端技術**
- **API 框架**: Node.js + Express 或 Python + FastAPI
- **地理空間處理**: PostGIS + Postgres
- **數據分析**: Python (pandas, numpy, scikit-learn)
- **緩存**: Redis
- **任務隊列**: Celery (Python) 或 Bull (Node.js)

#### **部署和基礎設施**
- **容器化**: Docker + Docker Compose
- **雲平台**: AWS, Google Cloud, 或 Azure
- **CI/CD**: GitHub Actions
- **監控**: Prometheus + Grafana

## 📊 **數據處理流程**

### **數據獲取和預處理**

#### **1. 數據源整合**
```python
# 數據獲取流程
def fetch_victoria_data():
    datasets = {
        'vista': 'Victorian Integrated Survey of Travel and Activity',
        'schools': 'School Locations',
        'vicmap': 'Vicmap Datasets',
        'building_permits': 'Building Permits',
        'crime_stats': 'Crime Statistics',
        'public_transport': 'Public Transport Lines and Stops',
        'socio_economic': 'ABS Socio-Economic Indexes',
        'planning': 'Planning Permit Activity'
    }
    
    for key, dataset in datasets.items():
        data = fetch_from_vic_gov_api(dataset)
        clean_and_transform(data)
        store_in_database(data)
```

#### **2. 地理空間數據處理**
```python
# 地理數據處理
def process_geospatial_data():
    # 坐標系統轉換
    convert_coordinate_systems()
    
    # 空間索引創建
    create_spatial_indexes()
    
    # 地理編碼和地址匹配
    geocode_addresses()
    
    # 空間關係計算
    calculate_spatial_relationships()
```

### **核心算法實現**

#### **1. 20分鐘可及性計算**
```python
class AccessibilityCalculator:
    def __init__(self, transport_network, facilities_data):
        self.transport_network = transport_network
        self.facilities_data = facilities_data
    
    def calculate_20min_coverage(self, origin_point, transport_mode='walking'):
        """
        計算從起點20分鐘內可達的設施
        """
        # 使用 Dijkstra 算法計算最短路徑
        reachable_facilities = []
        
        for facility in self.facilities_data:
            travel_time = self.calculate_travel_time(origin_point, facility, transport_mode)
            if travel_time <= 20:  # 20分鐘
                reachable_facilities.append({
                    'facility': facility,
                    'travel_time': travel_time,
                    'distance': self.calculate_distance(origin_point, facility)
                })
        
        return reachable_facilities
    
    def calculate_travel_time(self, origin, destination, mode):
        # 根據交通模式計算旅行時間
        if mode == 'walking':
            return self.walking_time(origin, destination)
        elif mode == 'public_transport':
            return self.public_transport_time(origin, destination)
        elif mode == 'cycling':
            return self.cycling_time(origin, destination)
```

#### **2. 連鎖效應模擬模型**
```python
class CascadeEffectSimulator:
    def __init__(self, community_data):
        self.community_data = community_data
        self.network_graph = self.build_community_network()
    
    def simulate_infrastructure_change(self, change_type, location, magnitude):
        """
        模擬基礎設施變化對社區的連鎖效應
        """
        # 第一階效應
        direct_effects = self.calculate_direct_effects(change_type, location, magnitude)
        
        # 第二階效應
        secondary_effects = self.calculate_secondary_effects(direct_effects)
        
        # 第三階效應
        tertiary_effects = self.calculate_tertiary_effects(secondary_effects)
        
        return {
            'direct': direct_effects,
            'secondary': secondary_effects,
            'tertiary': tertiary_effects,
            'total_impact': self.aggregate_effects(direct_effects, secondary_effects, tertiary_effects)
        }
    
    def build_community_network(self):
        """
        構建社區網絡圖，包含設施、人口、交通等節點
        """
        # 使用 NetworkX 構建圖
        G = nx.Graph()
        
        # 添加節點
        for facility in self.community_data['facilities']:
            G.add_node(facility['id'], type='facility', data=facility)
        
        for population in self.community_data['populations']:
            G.add_node(population['id'], type='population', data=population)
        
        # 添加邊（關係）
        for connection in self.community_data['connections']:
            G.add_edge(connection['from'], connection['to'], 
                      weight=connection['weight'], type=connection['type'])
        
        return G
```

#### **3. 弱勢群體識別算法**
```python
class VulnerablePopulationIdentifier:
    def __init__(self, socio_economic_data, accessibility_data):
        self.socio_economic_data = socio_economic_data
        self.accessibility_data = accessibility_data
    
    def identify_vulnerable_communities(self):
        """
        識別可能被忽視的弱勢群體和社區
        """
        vulnerability_scores = {}
        
        for area in self.socio_economic_data:
            # 計算脆弱性分數
            vulnerability_score = self.calculate_vulnerability_score(area)
            
            # 檢查可及性
            accessibility_score = self.calculate_accessibility_score(area)
            
            # 綜合評分
            combined_score = vulnerability_score * (1 - accessibility_score)
            
            vulnerability_scores[area['id']] = {
                'area': area,
                'vulnerability_score': vulnerability_score,
                'accessibility_score': accessibility_score,
                'combined_score': combined_score,
                'risk_level': self.categorize_risk_level(combined_score)
            }
        
        return vulnerability_scores
    
    def calculate_vulnerability_score(self, area):
        """
        基於多個因素計算脆弱性分數
        """
        factors = {
            'income': area.get('median_income', 0),
            'education': area.get('education_level', 0),
            'age': area.get('elderly_population_ratio', 0),
            'disability': area.get('disability_rate', 0),
            'unemployment': area.get('unemployment_rate', 0)
        }
        
        # 標準化分數
        normalized_scores = self.normalize_factors(factors)
        
        # 加權平均
        weights = {'income': 0.3, 'education': 0.2, 'age': 0.2, 
                  'disability': 0.15, 'unemployment': 0.15}
        
        vulnerability_score = sum(normalized_scores[factor] * weights[factor] 
                                for factor in factors.keys())
        
        return vulnerability_score
```

## 🗺️ **地圖和可視化實現**

### **互動式地圖功能**

#### **1. 多層地圖顯示**
```javascript
// React 組件示例
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';

const NeighbourhoodMap = ({ facilities, populations, accessibility }) => {
  return (
    <MapContainer center={[-37.8136, 144.9631]} zoom={10}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* 設施層 */}
      {facilities.map(facility => (
        <Circle
          key={facility.id}
          center={[facility.lat, facility.lng]}
          radius={100}
          fillColor="blue"
          color="blue"
        >
          <Popup>
            <div>
              <h3>{facility.name}</h3>
              <p>類型: {facility.type}</p>
              <p>服務範圍: {facility.service_area}km</p>
            </div>
          </Popup>
        </Circle>
      ))}
      
      {/* 20分鐘覆蓋範圍 */}
      {accessibility.map(area => (
        <Circle
          key={area.id}
          center={[area.lat, area.lng]}
          radius={area.radius}
          fillColor="green"
          color="green"
          fillOpacity={0.3}
        >
          <Popup>
            <div>
              <h3>20分鐘覆蓋範圍</h3>
              <p>可達設施: {area.accessible_facilities}</p>
              <p>人口覆蓋: {area.population_coverage}</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
};
```

#### **2. 數據可視化儀表板**
```javascript
// 使用 D3.js 創建可視化
import * as d3 from 'd3';

class AccessibilityDashboard {
  constructor(containerId) {
    this.container = d3.select(containerId);
    this.width = 800;
    this.height = 600;
  }
  
  createAccessibilityChart(data) {
    const svg = this.container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    
    // 創建條形圖
    const x = d3.scaleBand()
      .range([0, this.width])
      .padding(0.1);
    
    const y = d3.scaleLinear()
      .range([this.height, 0]);
    
    x.domain(data.map(d => d.area));
    y.domain([0, d3.max(data, d => d.accessibility_score)]);
    
    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.area))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.accessibility_score))
      .attr('height', d => this.height - y(d.accessibility_score))
      .attr('fill', 'steelblue');
  }
}
```

## 📱 **響應式設計和移動優化**

### **移動端適配**
```css
/* 響應式 CSS */
.neighbourhood-map {
  width: 100%;
  height: 100vh;
}

@media (max-width: 768px) {
  .neighbourhood-map {
    height: 60vh;
  }
  
  .dashboard-panel {
    flex-direction: column;
  }
  
  .control-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #ccc;
    padding: 10px;
  }
}
```

### **觸控優化**
```javascript
// 觸控手勢支持
class TouchOptimizedMap {
  constructor(mapElement) {
    this.map = mapElement;
    this.setupTouchGestures();
  }
  
  setupTouchGestures() {
    let startX, startY, startDistance;
    
    this.map.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        startDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    });
    
    this.map.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / startDistance;
        this.zoomMap(scale);
      }
    });
  }
  
  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
```

## 🚀 **開發時程規劃**

### **第一週: 數據準備和基礎架構**
- **Day 1-2**: 數據集評估和選擇
- **Day 3-4**: 數據清洗和預處理
- **Day 5-7**: 基礎架構搭建

### **第二週: 核心功能開發**
- **Day 8-10**: 20分鐘可及性計算引擎
- **Day 11-13**: 連鎖效應模擬模型
- **Day 14**: 弱勢群體識別算法

### **第三週: 用戶界面開發**
- **Day 15-17**: 互動式地圖界面
- **Day 18-20**: 數據可視化儀表板
- **Day 21**: 社區參與工具

### **第四週: 測試和優化**
- **Day 22-24**: 功能測試和調試
- **Day 25-26**: 性能優化
- **Day 27-28**: 文檔撰寫和最終提交

## 🔧 **部署和維護**

### **Docker 配置**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### **環境配置**
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/neighbourhood
    depends_on:
      - db
      - redis
  
  db:
    image: postgis/postgis:15-3.3
    environment:
      - POSTGRES_DB=neighbourhood
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

*技術文檔版本: 1.0*  
*適用於: GovHack 2025 20-Minute Neighbourhood Plan 專案*  
*最後更新: 2025年 GovHack 競賽期間*
