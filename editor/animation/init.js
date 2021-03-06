//Dont change it
requirejs(['ext_editor_io', 'jquery_190', 'raphael_210'],
    function (extIO, $) {
        function connectStarsAnimation(tgt_node, data) {

            if (! data || ! data.ext) {
                return
            }

            const input = data.in
            const output = data.out
            const explanation = data.ext.explanation
            const answer = data.ext.answer

            /*----------------------------------------------*
             *
             * attr
             *
             *----------------------------------------------*/
            const attr = {
                number_scale: {
                    'font-size': '10px',
                },
                background: {
                    'stroke-width': '0px',
                    'fill': '#82D1F5',
                },
                axis: {
                    'stroke-width': '1px',
                    'stroke': '#82D1F5',
                    'stroke': '#50C0F0',
                },
                edge: {
                    prepare: {
                        'stroke-width': '0.5px',
                        'stroke': '#82D1F5',
                    },
                    draw: {
                        'stroke': '#294270',
                    }
                },
                vertex: {
                    'stroke-width': '0',
                    'fill': '#294270',
                },
                constellation_name: {
                    'font-style': 'italic',
                    'font-size': '12px',
                    'text-anchor': 'end',
                    'fill': 'black',
                },
                slider_light: {
                    'stroke-width': 0.2,
                    'fill': '#82D1F5',
                },
                slider_dark: {
                    'stroke-width': 0.2,
                    'fill': 'black',
                },
                toggle: {
                    'stroke-width': 0,
                    'fill': 'white',
                },
                text_light: {
                    'text-anchor': 'end',
                    'font-weight': 'bold',
                },
                text_dark: {
                    'text-anchor': 'start',
                    'font-weight': 'bold',
                },
            };

           /*----------------------------------------------*
             *
             * values
             *
             *----------------------------------------------*/
            const grid_size_px = 300
            const os_h = 30
            const os_v = 20
            let units = 0
            let unit = 0
            let vertices_px = []

            /*----------------------------------------------*
             *
             * paper
             *
             *----------------------------------------------*/
            const paper = Raphael(tgt_node, grid_size_px+os_h*2, grid_size_px+os_v*2, 0, 0)
            let stars = paper.set()
            let lines = paper.set()
            let axes = paper.set()
            let name = paper.set()

            /*----------------------------------------------*
             *
             * draw toggle-switch
             *
             *----------------------------------------------*/
            const [tx, ty] = [os_h+grid_size_px-45, os_v/2-7]
            const slider_width = 10
            const slider_height = 10
            const r = slider_height/2

            const slider = paper.path(['M', tx, ty,
                        'h', slider_width,
                        'a', r, r, 0, 0, 1, 0, r*2,
                        'h', -slider_width,
                        'a', r, r, 0, 0, 1, 0, -r*2,
            ]).attr(attr.slider_light)
            paper.text(tx-10, ty+slider_height/2, 'light').attr(attr.text_light)
            paper.text(tx+10+slider_width, ty+slider_height/2, 'dark').attr(attr.text_dark)
            const toggle = paper.circle(tx, ty+slider_height/2, r).attr(attr.toggle)

            /*----------------------------------------------*
             *
             * draw rect
             *
             *----------------------------------------------*/
            const rect = paper.rect(os_h, os_v, grid_size_px, grid_size_px).attr(attr.background)
            let flg = 0 // 0 : light, 1 : dark
            tgt_node.onclick = function(){
                flg = 1 - flg
                rect.animate(flg ? {'fill': 'black'} : attr.background)
                lines.animate(flg ? {'stroke': 'white'} : attr.edge.draw)
                stars.animate(flg ? {'fill': 'orange'} : attr.vertex)
                name.animate(flg ? {'fill': 'white'} : attr.constellation_name)
                axes.animate(flg ? {'stroke': 'black'} : attr.axis)
                toggle.animate({'transform': ['t', slider_width*flg, 0]}, 100)
                slider.animate(flg ? attr.slider_dark : attr.slider_light, 400)
            }

            /*----------------------------------------------*
             *
             * draw axis
             *
             *----------------------------------------------*/
            const axis = [
                ['M', os_h, os_v+grid_size_px, 'h', grid_size_px],
                ['M', os_h-5, os_v+grid_size_px/2, 'h', 5+grid_size_px],
                ['M', os_h-5, os_v, 'h', 5+grid_size_px],
                ['M', os_h, os_v, 'v', grid_size_px],
                ['M', os_h+grid_size_px/2, os_v, 'v', grid_size_px+5],
                ['M', os_h+grid_size_px, os_v, 'v', grid_size_px+5],
            ]

            for (const path of axis) {
                axes.push(paper.path(path).attr(attr.axis))
            }

            /*----------------------------------------------*
             *
             * main
             *
             *----------------------------------------------*/
            draw_scale(input)
            draw_vertices(input)
            if (validate_output(input, output)) {
                draw_edges(output)
            }

            /*----------------------------------------------*
             *
             * validate output
             *
             *----------------------------------------------*/
            function validate_output(input, output) {
                const is_array = Array.isArray(output)
                if (! is_array || output.length > input.length-1) {
                    return false
                }
                for (let edge of output) {
                    const is_array = Array.isArray(edge)
                    if (! is_array || edge.length !== 2) {
                        return false
                    }
                    for (let idx of edge) {
                        const type = typeof idx
                        if (type !== 'number' || idx < 0 || idx > input.length-1) {
                            return false
                        }
                    }
                }
                return true
            }

            /*----------------------------------------------*
             *
             * scale
             *
             *----------------------------------------------*/
            function draw_scale(input) {
                let max_value = 0

                for (const [x, y] of input) {
                    max_value = Math.max(...[max_value, x, y])
                }

                units = 0
                const max_scale = [1000, 500, 400, 350, 300, 250, 200, 150, 100, 50, 10, 6, 5]
                for (const ms of max_scale) {
                    if (ms > max_value) {
                        units = ms
                    }
                }

                unit = grid_size_px / units
                const values = [
                    [os_h, os_v+grid_size_px+os_v/2, 0],
                    [os_h+(grid_size_px/2), os_v+(grid_size_px)+os_v/2, units/2],
                    [os_h+grid_size_px, os_v+grid_size_px+os_v/2, units],
                    [os_h/2, os_v+grid_size_px/2, units/2],
                    [os_h/2, os_v, units],
                ]

                for (const [x, y, num] of values) {
                    paper.text(x, y, num).attr(attr.number_scale)
                }
            }

            /*----------------------------------------------*
             *
             * constellation name
             *
             *----------------------------------------------*/
            if (explanation) {
                name = paper.text(os_h+grid_size_px-6, os_v+grid_size_px-8, explanation).attr(attr.constellation_name)
            }

            /*----------------------------------------------*
             *
             * draw vertices
             *
             *----------------------------------------------*/
            function draw_vertices(input) {
                vertices_px = []
                for (const [x, y] of input) {
                    const x_px = x*unit+os_h
                    const y_px = (units-y)*unit+os_v
                    vertices_px.push([x_px, y_px])
                    stars.push(paper.circle(x_px, y_px, 1.5).attr(attr.vertex))
                }
            }

            /*----------------------------------------------*
             *
             * draw edges
             *
             *----------------------------------------------*/
            function draw_edges(output) {
                const edges = []
                for (const [coord_1, coord_2] of output) {
                    const [x1, y1] = vertices_px[coord_1]
                    const [x2, y2] = vertices_px[coord_2]
                    const e = paper.path(['M', x1, y1, 'L', x2, y2]).attr(attr.edge.prepare)
                    lines.push(e)
                    edges.push(e)
                }

                //animation edges
                let i = edges.length
                function animation() {
                    if (i <= 0 || flg) {
                        lines.animate(flg ? {'stroke': 'white'} : attr.edge.draw)
                        return
                    }
                    i -= 1
                    edges[i].animate(attr.edge.draw, 100, animation)
                }
                animation()
            }
        }

        var $tryit;

        var io = new extIO({
            multipleArguments: false,
            functions: {
                python: 'connect_stars',
                js: 'connectStars'
            },
            animation: function($expl, data){
                connectStarsAnimation(
                    $expl[0],
                    data,
                );
            }
        });
        io.start();
    }
);
