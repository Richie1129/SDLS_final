export const visNetworkOptions = {
    edges: {
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 0.5,
                type: "arrow"
            },
        },
        smooth: {
            enabled: true,
            type: 'dynamic',
        },
        color: {
            color: '#4d4c4c',
            highlight: '#121619',
            hover: '#353535',
        },
    },
    physics: {
        enabled: true,
        barnesHut: {
            // gravitationalConstant: -20000,
            // centralGravity: 0.3,
            // springLength: 300,
            // springConstant: 0.04,
            // damping: 0.09,
            avoidOverlap: 0.2 // 这个参数可以帮助控制节点之间的间距
        }
    },
    // nodes: {
    //     widthConstraint:{
    //         minimum:500
    //     },
    //     heightConstraint:{
    //         minimum:150
    //     }

    // },
    interaction: { hover: true },
    manipulation: {
        enabled: true,
    },
};