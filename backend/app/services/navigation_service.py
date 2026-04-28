import json, os, heapq

_map_path = os.path.join(os.path.dirname(__file__), "../../..", "data", "campus_map.json")

with open(_map_path) as f:
    GRAPH = json.load(f)

def get_all_locations() -> list:
    return [{"id": k, "label": v["label"], "x": v["x"], "y": v["y"], "neighbors": v["neighbors"]} for k, v in GRAPH.items()]

def get_path(start: str, end: str) -> list:
    if start not in GRAPH or end not in GRAPH:
        return []
    heap, visited = [(0, start, [start])], set()
    while heap:
        cost, node, path = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)
        if node == end:
            return path
        for neighbor, weight in GRAPH[node]["neighbors"].items():
            if neighbor not in visited:
                heapq.heappush(heap, (cost + weight, neighbor, path + [neighbor]))
    return []
