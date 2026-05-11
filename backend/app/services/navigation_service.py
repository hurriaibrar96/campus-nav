import json, os, heapq

_map_path     = os.path.join(os.path.dirname(__file__), "../../data/campus_map.json")
_map_path_ahs = os.path.join(os.path.dirname(__file__), "../../data/campus_map_ahs.json")

with open(_map_path) as f:
    GRAPH = json.load(f)

with open(_map_path_ahs) as f:
    GRAPH_AHS = json.load(f)

AHS_STARTS = {"ahs_faculty"}

def _get_graph(start: str) -> dict:
    return GRAPH_AHS if start in AHS_STARTS else GRAPH

def get_all_locations(start: str = "") -> list:
    graph = _get_graph(start) if start else GRAPH
    return [{"id": k, "label": v["label"], "x": v["x"], "y": v["y"], "neighbors": v["neighbors"]} for k, v in graph.items()]

def get_path(start: str, end: str) -> list:
    start = start.lower().strip()
    end   = end.lower().strip()
    graph = _get_graph(start)
    if start not in graph or end not in graph:
        return []
    heap, visited = [(0, start, [start])], set()
    while heap:
        cost, node, path = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)
        if node == end:
            return path
        for neighbor, val in graph[node]["neighbors"].items():
            if neighbor not in visited:
                weight = val["distance"] if isinstance(val, dict) else val
                heapq.heappush(heap, (cost + weight, neighbor, path + [neighbor]))
    return []
